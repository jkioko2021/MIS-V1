import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { restoreReviewFocus } from './risk-review-focus';

export default function RiskReviewDialog({ open, riskCode, mutating, onClose, children, trigger }: {
  open: boolean; riskCode: string; mutating: boolean; onClose: () => void; children: ReactNode;
  trigger?: HTMLButtonElement | null;
}) {
  return <Dialog open={open} onOpenChange={nextOpen => { if (!nextOpen && !mutating) onClose(); }}>
    <DialogContent className="w-[calc(100%-2rem)] max-w-5xl max-h-[85dvh]" data-testid="risk-review-dialog"
      onCloseAutoFocus={event => { event.preventDefault(); restoreReviewFocus(trigger ?? null); }}
      onEscapeKeyDown={event => { if (mutating) event.preventDefault(); }}
      onInteractOutside={event => event.preventDefault()}>
      <DialogHeader className="pr-6">
        <DialogTitle>Review assessment · {riskCode}</DialogTitle>
        <DialogDescription>Review this submitted risk, its root causes and saved assessment. Any permitted corrections are saved here. Record the department Review or Return decision below the submitted summary after closing this window.</DialogDescription>
      </DialogHeader>
      {open && <div className="min-w-0">{children}</div>}
    </DialogContent>
  </Dialog>;
}
