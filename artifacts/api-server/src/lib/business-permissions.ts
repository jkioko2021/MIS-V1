import type { NextFunction, Request, Response } from "express";
import { queryOne } from "./postgres";
import { logger } from "./logger";
import { giActor } from "./gi-workflow";

const BUSINESS_TRACKING_PROFILES = new Set([
  "superadmin",
  "system admin",
  "business entry",
  "bpo",
  "bpo admin",
  "bpo review",
  "medical uw",
  "membership admin",
  "dispatch",
  "finance",
]);

const BPO_FORWARD_PROFILES = new Set([
  "superadmin",
  "system admin",
  "business entry",
  "bpo",
  "bpo admin",
  "bpo review",
]);

const BPO_REVIEW_PROFILES = new Set([
  "superadmin",
  "system admin",
  "bpo",
  "bpo admin",
  "bpo review",
]);

const BPO_ALLOCATED_PROFILES = new Set([
  "superadmin",
  "system admin",
  "bpo",
  "bpo admin",
  "bpo review",
  "membership admin",
]);

const BUSINESS_DELETE_PROFILES = new Set([
  "superadmin",
  "system admin",
]);

function profileKey(profileName: string): string {
  return profileName.trim().replace(/\s+/g, " ").toLowerCase();
}

async function currentProfileName(employeeId: number): Promise<string | null> {
  const employee = await queryOne<{ profile_name: string }>(
    `SELECT p.profile_name
     FROM crm.employees e
     JOIN crm.profiles p ON p.profile_id = e.profile_id
     WHERE e.employee_id = $1
       AND e.activated = TRUE
       AND e.approved = TRUE
       AND e.employee_locked = FALSE
       AND e.is_deleted = FALSE
       AND p.is_active = TRUE`,
    [employeeId],
  );
  return employee?.profile_name ?? null;
}

function requireBusinessProfile(allowedProfiles: Set<string>, action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const profileName = await currentProfileName(req.user!.sub);
      if (!profileName || !allowedProfiles.has(profileKey(profileName))) {
        logger.warn({ employeeId: req.user!.sub, action }, "Business access denied");
        res.status(403).json({ ok: false, error: "You do not have access to this business workflow." });
        return;
      }
      next();
    } catch (err) {
      logger.error({ err, employeeId: req.user!.sub, action }, "Business permission check failed");
      res.status(500).json({ ok: false, error: "Unable to verify business workflow access." });
    }
  };
}

export const requireBusinessTrackingAccess = requireBusinessProfile(
  BUSINESS_TRACKING_PROFILES,
  "business_tracking",
);

export const requireBpoForwardAccess = requireBusinessProfile(
  BPO_FORWARD_PROFILES,
  "forward_to_bpo_review",
);

export const requireBpoReviewAccess = requireBusinessProfile(
  BPO_REVIEW_PROFILES,
  "bpo_review",
);

export async function requireBpoAllocatedAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [profile,actor] = await Promise.all([currentProfileName(req.user!.sub),giActor(req.user!.sub)]);
    if (!profile || !(BPO_ALLOCATED_PROFILES.has(profileKey(profile)) || actor?.is_gi)) {
      res.status(403).json({ok:false,error:"Allocated Files access is required."});
      return;
    }
    res.locals.isGiStaff=!!actor?.is_gi;
    res.locals.isGiAdmin=!!actor?.is_admin;
    res.locals.canAccessMembershipAllocated=!!profile && BPO_ALLOCATED_PROFILES.has(profileKey(profile));
    next();
  } catch(err) {
    logger.error({err},"Allocated access check failed");
    res.status(500).json({ok:false,error:"Unable to verify allocated access."});
  }
}

// Allocation Files is a personal operational queue. A broad BPO profile is not
// enough to expose a record: regular users may read only the active ALLOCATED
// file assigned to their username, while SuperAdmin retains the oversight view.
export async function requireAllocatedFileReadAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [profileName, file] = await Promise.all([
      currentProfileName(req.user!.sub),
      queryOne<{ allocated_to: string | null; gi_lane: boolean }>(
        `SELECT allocated_to,EXISTS (SELECT 1 FROM crm.business_work_items w
           WHERE w.file_no=b.file_no AND w.queue_name='GI_ALLOCATED' AND w.work_status='OPEN') AS gi_lane
         FROM crm.business_tracking b
         WHERE b.file_no=$1
           AND is_active=TRUE
           AND allocated=TRUE
           AND file_status='ALLOCATED'
           AND (EXISTS (SELECT 1 FROM crm.business_work_items g WHERE g.file_no=b.file_no
                  AND g.queue_name='GI_ALLOCATED' AND g.work_status='OPEN')
             OR client_type NOT IN ('C','S') OR rate_type IS DISTINCT FROM 'C' OR benefit_verified='YES')`,
        [req.params.fileNo],
      ),
    ]);

    const actor=await giActor(req.user!.sub);
    const permitted=file?.gi_lane ? (actor?.is_gi || actor?.is_admin)
      : !!profileName && BPO_ALLOCATED_PROFILES.has(profileKey(profileName));
    if (!permitted) {
      logger.warn({ employeeId: req.user!.sub, fileNo: req.params.fileNo }, "Allocated file access denied");
      res.status(403).json({ ok: false, error: "You do not have access to Allocation Files." });
      return;
    }
    if (!file) {
      res.status(404).json({ ok: false, error: "Allocated file not found." });
      return;
    }
    if (!(file.gi_lane ? actor?.is_admin : req.user?.profileId === 1)
      && file.allocated_to !== req.user!.username) {
      logger.warn({ employeeId: req.user!.sub, fileNo: req.params.fileNo }, "Allocated file ownership denied");
      res.status(403).json({ ok: false, error: "You can only view files allocated to your account." });
      return;
    }
    next();
  } catch (err) {
    logger.error({ err, employeeId: req.user?.sub, fileNo: req.params.fileNo }, "Allocated file permission check failed");
    res.status(500).json({ ok: false, error: "Unable to verify allocated file access." });
  }
}

export const requireBusinessDeleteAccess = requireBusinessProfile(
  BUSINESS_DELETE_PROFILES,
  "delete_business_tracking",
);

export async function setBpoReviewAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profileName = await currentProfileName(req.user!.sub);
    res.locals.canAccessBpoReview = !!profileName && BPO_REVIEW_PROFILES.has(profileKey(profileName));
    next();
  } catch (err) {
    logger.error({ err, employeeId: req.user!.sub }, "BPO review access check failed");
    res.status(500).json({ ok: false, error: "Unable to verify BPO review access." });
  }
}

export async function requireBusinessFileAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const giWork=await queryOne<{work_item_id:number}>(`SELECT work_item_id FROM crm.business_work_items
      WHERE file_no=$1 AND queue_name IN ('GI_ALLOCATE','GI_ALLOCATED') AND work_status='OPEN'`,[req.params.fileNo]);
    if(giWork) {
      if(req.path==="/allocation-action" || req.path==="/notes" && req.method==="POST") {
        await requireAllocatedFileReadAccess(req,res,next); return;
      }
      res.status(403).json({ok:false,error:"Use the GI workspace to access this file."});
      return;
    }
    const [profileName, bpoWorkItem] = await Promise.all([
      currentProfileName(req.user!.sub),
      queryOne<{ work_item_id: number }>(
        `SELECT work_item_id
         FROM crm.business_work_items
          WHERE file_no=$1
            AND queue_name IN ('BPO_REVIEW_RETAIL', 'BPO_REVIEW_CORPORATE_SME')
            AND work_status='OPEN'`,
        [req.params.fileNo],
      ),
    ]);
    const allowedProfiles = bpoWorkItem ? BPO_REVIEW_PROFILES : BUSINESS_TRACKING_PROFILES;
    if (!profileName || !allowedProfiles.has(profileKey(profileName))) {
      logger.warn({ employeeId: req.user!.sub, fileNo: req.params.fileNo }, "Business file access denied");
      res.status(403).json({ ok: false, error: "You do not have access to this business file." });
      return;
    }
    next();
  } catch (err) {
    logger.error({ err, employeeId: req.user!.sub, fileNo: req.params.fileNo }, "Business file permission check failed");
    res.status(500).json({ ok: false, error: "Unable to verify business file access." });
  }
}

export function requireBpoQueueAccess(req: Request, res: Response, next: NextFunction): void {
  const queue = typeof req.query.queue === "string" ? req.query.queue : undefined;
  if (queue === "bpo-review" || queue === "bpo-retail" || queue === "bpo-corporate-sme") {
    requireBpoReviewAccess(req, res, next);
    return;
  }
  next();
}