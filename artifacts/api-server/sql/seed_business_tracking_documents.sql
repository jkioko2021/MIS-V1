/*
  Seed the legacy CRM business-tracking document master.

  Target: CRM.dbo.TBL_MIS_CRM_BUSINESS_REQ
  Behavior:
    - Never creates or alters the target table.
    - Validates the target schema and the supplied master set first.
    - Updates only the supplied DOC_ID values and inserts missing values.
    - Does not delete or reset unrelated document definitions.
    - Is safe to execute repeatedly.

  The script intentionally uses DOC_ID as the primary matching key and checks
  DOC_CODE for conflicting rows before making any changes. Run it with an
  account that can read catalog metadata and update this table. Execute it in a
  SQL Server client that supports GO batch separators (for example, SSMS,
  Azure Data Studio, or sqlcmd). The script is not called by application
  startup: static review does not prove a live load until the configured CRM
  SQL Server can be reached.
*/

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_ID(N'CRM') IS NULL
    THROW 51000, 'Required database CRM does not exist on this SQL Server.', 1;
GO

USE [CRM];
GO

IF OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ', N'U') IS NULL
    THROW 51001, 'Required table CRM.dbo.TBL_MIS_CRM_BUSINESS_REQ does not exist. The seed will not create it.', 1;
GO

CREATE TABLE #BusinessRequirements
(
    DOC_ID        int            NOT NULL PRIMARY KEY,
    DOC_CODE      nvarchar(30)   NOT NULL UNIQUE,
    DOC_NAME      nvarchar(200)  NOT NULL,
    BUSINESS_TYPE nvarchar(10)   NOT NULL,
    CLIENT        nvarchar(10)   NOT NULL,
    ACTIVE        int            NOT NULL,
    CODE          int            NOT NULL
);

INSERT INTO #BusinessRequirements
    (DOC_ID, DOC_CODE, DOC_NAME, BUSINESS_TYPE, CLIENT, ACTIVE, CODE)
VALUES
    (90,  N'RET01', N'Member Application Form(Full)', N'B', N'R', 1, 1),
    (91,  N'RET02', N'ID or Passport(Front&Back)',    N'B', N'R', 1, 1),
    (92,  N'RET03', N'Pin Certificate',               N'B', N'R', 1, 1),
    (93,  N'RET04', N'Payment Proof',                 N'B', N'R', 1, 1),
    (94,  N'RET05', N'Passport Photo',                N'B', N'R', 1, 1),
    (95,  N'RET06', N'Medical Report',                N'B', N'R', 1, 1),
    (96,  N'RET07', N'Renewal Schedule',              N'B', N'R', 1, 1),
    (97,  N'RET08', N'Invoice',                       N'B', N'R', 1, 1),
    (98,  N'RET09', N'Contact Update Form',            N'B', N'R', 1, 1),
    (99,  N'RET10', N'Change Of Rep Letter',           N'B', N'R', 1, 1),
    (100, N'RET11', N'Other Documents',                N'B', N'R', 1, 1),
    (101, N'RET12', N'Email Correspondence',            N'B', N'R', 1, 1),
    (102, N'RET13', N'Corporate proposal form',         N'B', N'C', 1, 1),
    (103, N'RET14', N'Registration Certificate',       N'B', N'C', 1, 1),
    (104, N'RET15', N'CR12',                           N'B', N'C', 1, 1),
    (105, N'RET16', N'Fund contract',                  N'B', N'C', 1, 1),
    (106, N'RET17', N'Rates and benefit Matrix',       N'B', N'C', 1, 1),
    (107, N'RET18', N'Premium summary',                N'B', N'C', 1, 1),
    (108, N'RET19', N'Payment Proof',                  N'B', N'C', 1, 1),
    (109, N'RET20', N'Member List',                    N'B', N'C', 1, 1),
    (110, N'RET21', N'Tender award letter',            N'B', N'C', 1, 1),
    (111, N'RET22', N'Certificate of Practice',        N'B', N'C', 1, 1),
    (112, N'RET23', N'Change Of Rep Letter',           N'B', N'C', 1, 1),
    (113, N'RET24', N'System Receipt',                 N'B', N'C', 1, 3),
    (114, N'RET25', N'SODA',                           N'B', N'C', 1, 1),
    (115, N'RET26', N'Allocation Form',                N'B', N'C', 1, 1),
    (116, N'RET27', N'Credit Note',                   N'B', N'C', 1, 1),
    (117, N'RET28', N'Policy Schedule',                N'B', N'C', 1, 4),
    (118, N'RET29', N'Refund Documents',               N'B', N'C', 1, 5),
    (119, N'RET30', N'System Invoice',                 N'B', N'C', 1, 3),
    (120, N'RET31', N'Refund Advice',                  N'B', N'C', 1, 5),
    (121, N'RET32', N'Refund Schedule',                N'B', N'C', 1, 5),
    (122, N'RET33', N'Finance Approval',               N'B', N'C', 1, 5),
    (123, N'RET34', N'Bank Confirmation',              N'B', N'C', 1, 5),
    (124, N'RET35', N'Remittance',                     N'B', N'C', 1, 5),
    (125, N'RET36', N'Decline letter',                N'B', N'C', 1, 5),
    (126, N'RET37', N'Debit Note',                    N'B', N'C', 1, 5),
    (127, N'RET38', N'Statement',                     N'B', N'C', 1, 5),
    (128, N'RET39', N'Credit Note',                   N'B', N'C', 1, 5),
    (129, N'RET40', N'Other Documents',               N'B', N'C', 1, 5),
    (130, N'RET41', N'Finance Approval',              N'B', N'C', 1, 1),
    (131, N'RET42', N'Final Summary',                 N'B', N'C', 1, 5),
    (132, N'RET43', N'AML Report',                    N'B', N'C', 1, 4),
    (133, N'RET44', N'Email Correspondence',          N'B', N'C', 1, 1),
    (134, N'RET45', N'Other Documents',               N'B', N'C', 1, 1);

DECLARE @SchemaErrors nvarchar(max) = N'';
DECLARE @DocIdType sysname;
DECLARE @DocCodeType sysname;
DECLARE @DocNameType sysname;
DECLARE @BusinessTypeType sysname;
DECLARE @ClientType sysname;
DECLARE @ActiveType sysname;
DECLARE @CodeType sysname;
DECLARE @DocIdMaxLength int;
DECLARE @DocCodeMaxLength int;
DECLARE @DocNameMaxLength int;
DECLARE @BusinessTypeMaxLength int;
DECLARE @ClientMaxLength int;
DECLARE @DocIdColumnId int;
DECLARE @DocIdIsIdentity bit;
DECLARE @DocIdIsNullable bit;

SELECT
    @DocIdType = LOWER(t.name),
    @DocIdMaxLength = CASE WHEN t.name IN (N'nchar', N'nvarchar') AND c.max_length >= 0
                          THEN c.max_length / 2 ELSE c.max_length END,
    @DocIdColumnId = c.column_id,
    @DocIdIsIdentity = CONVERT(bit, ISNULL(ic.is_identity, 0)),
    @DocIdIsNullable = c.is_nullable
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
LEFT JOIN sys.identity_columns AS ic
  ON ic.object_id = c.object_id
 AND ic.column_id = c.column_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'DOC_ID';

SELECT
    @DocCodeType = LOWER(t.name),
    @DocCodeMaxLength = CASE WHEN t.name IN (N'nchar', N'nvarchar') AND c.max_length >= 0
                            THEN c.max_length / 2 ELSE c.max_length END
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'DOC_CODE';

SELECT
    @DocNameType = LOWER(t.name),
    @DocNameMaxLength = CASE WHEN t.name IN (N'nchar', N'nvarchar') AND c.max_length >= 0
                            THEN c.max_length / 2 ELSE c.max_length END
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'DOC_NAME';

SELECT
    @BusinessTypeType = LOWER(t.name),
    @BusinessTypeMaxLength = CASE WHEN t.name IN (N'nchar', N'nvarchar') AND c.max_length >= 0
                                  THEN c.max_length / 2 ELSE c.max_length END
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'BUSINESS_TYPE';

SELECT
    @ClientType = LOWER(t.name),
    @ClientMaxLength = CASE WHEN t.name IN (N'nchar', N'nvarchar') AND c.max_length >= 0
                            THEN c.max_length / 2 ELSE c.max_length END
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'CLIENT';

SELECT @ActiveType = LOWER(t.name)
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'ACTIVE';

SELECT @CodeType = LOWER(t.name)
FROM sys.columns AS c
JOIN sys.types AS t
  ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
  AND c.name = N'CODE';

IF @DocIdType IS NULL
    SET @SchemaErrors += N'DOC_ID column is missing; ';
ELSE IF @DocIdType NOT IN (N'tinyint', N'smallint', N'int', N'bigint')
    SET @SchemaErrors += N'DOC_ID must be an integer type, found ' + @DocIdType + N'; ';
ELSE IF @DocIdIsNullable = 1
    SET @SchemaErrors += N'DOC_ID must be NOT NULL to serve as the load key; ';

IF @DocCodeType IS NULL
    SET @SchemaErrors += N'DOC_CODE column is missing; ';
ELSE IF @DocCodeType NOT IN (N'char', N'varchar', N'nchar', N'nvarchar')
    SET @SchemaErrors += N'DOC_CODE must be a character type, found ' + @DocCodeType + N'; ';

IF @DocNameType IS NULL
    SET @SchemaErrors += N'DOC_NAME column is missing; ';
ELSE IF @DocNameType NOT IN (N'char', N'varchar', N'nchar', N'nvarchar')
    SET @SchemaErrors += N'DOC_NAME must be a character type, found ' + @DocNameType + N'; ';

IF @BusinessTypeType IS NULL
    SET @SchemaErrors += N'BUSINESS_TYPE column is missing; ';
ELSE IF @BusinessTypeType NOT IN (N'char', N'varchar', N'nchar', N'nvarchar')
    SET @SchemaErrors += N'BUSINESS_TYPE must be a character type, found ' + @BusinessTypeType + N'; ';

IF @ClientType IS NULL
    SET @SchemaErrors += N'CLIENT column is missing; ';
ELSE IF @ClientType NOT IN (N'char', N'varchar', N'nchar', N'nvarchar')
    SET @SchemaErrors += N'CLIENT must be a character type, found ' + @ClientType + N'; ';

IF @ActiveType IS NULL
    SET @SchemaErrors += N'ACTIVE column is missing; ';
ELSE IF @ActiveType NOT IN (N'bit', N'tinyint', N'smallint', N'int', N'bigint')
    SET @SchemaErrors += N'ACTIVE must be a boolean/integer type, found ' + @ActiveType + N'; ';

IF @CodeType IS NULL
    SET @SchemaErrors += N'CODE column is missing; ';
ELSE IF @CodeType NOT IN
    (N'bit', N'tinyint', N'smallint', N'int', N'bigint', N'decimal', N'numeric',
     N'money', N'smallmoney', N'char', N'varchar', N'nchar', N'nvarchar')
    SET @SchemaErrors += N'CODE must be a numeric or character type, found ' + @CodeType + N'; ';

IF @DocCodeMaxLength IS NOT NULL AND @DocCodeMaxLength <> -1
   AND @DocCodeMaxLength < (SELECT MAX(LEN(DOC_CODE)) FROM #BusinessRequirements)
    SET @SchemaErrors += N'DOC_CODE is shorter than the supplied master values; ';

IF @DocNameMaxLength IS NOT NULL AND @DocNameMaxLength <> -1
   AND @DocNameMaxLength < (SELECT MAX(LEN(DOC_NAME)) FROM #BusinessRequirements)
    SET @SchemaErrors += N'DOC_NAME is shorter than the supplied master values; ';

IF @BusinessTypeMaxLength IS NOT NULL AND @BusinessTypeMaxLength <> -1
   AND @BusinessTypeMaxLength < (SELECT MAX(LEN(BUSINESS_TYPE)) FROM #BusinessRequirements)
    SET @SchemaErrors += N'BUSINESS_TYPE is shorter than the supplied master values; ';

IF @ClientMaxLength IS NOT NULL AND @ClientMaxLength <> -1
   AND @ClientMaxLength < (SELECT MAX(LEN(CLIENT)) FROM #BusinessRequirements)
    SET @SchemaErrors += N'CLIENT is shorter than the supplied master values; ';

IF @DocIdColumnId IS NOT NULL
   AND NOT EXISTS
   (
       SELECT 1
       FROM sys.indexes AS i
       JOIN sys.index_columns AS ic
         ON ic.object_id = i.object_id
        AND ic.index_id = i.index_id
       WHERE i.object_id = OBJECT_ID(N'dbo.TBL_MIS_CRM_BUSINESS_REQ')
         AND i.is_unique = 1
         AND i.is_disabled = 0
         AND ic.key_ordinal = 1
         AND ic.column_id = @DocIdColumnId
         AND NOT EXISTS
         (
             SELECT 1
             FROM sys.index_columns AS ic_extra
             WHERE ic_extra.object_id = i.object_id
               AND ic_extra.index_id = i.index_id
               AND ic_extra.key_ordinal > 1
         )
   )
    SET @SchemaErrors += N'DOC_ID must have a unique single-column key or index; ';

IF @SchemaErrors <> N''
    THROW 51002, @SchemaErrors, 1;

IF (SELECT COUNT(*) FROM #BusinessRequirements) <> 45
    THROW 51003, 'The supplied business document master must contain exactly 45 rows.', 1;

IF (SELECT MIN(DOC_ID) FROM #BusinessRequirements) <> 90
   OR (SELECT MAX(DOC_ID) FROM #BusinessRequirements) <> 134
    THROW 51004, 'The supplied business document master must cover DOC_ID 90 through 134.', 1;

IF EXISTS
(
    SELECT 1
    FROM #BusinessRequirements
    WHERE BUSINESS_TYPE <> N'B'
       OR ACTIVE <> 1
       OR (DOC_ID BETWEEN 90 AND 101 AND CLIENT <> N'R')
       OR (DOC_ID BETWEEN 102 AND 134 AND CLIENT <> N'C')
)
    THROW 51005, 'The supplied master values failed the BUSINESS_TYPE, ACTIVE, or CLIENT split validation.', 1;

DECLARE @TransactionStarted bit = 0;
DECLARE @IdentityInsertEnabled bit = 0;
DECLARE @UpdatedRows int = 0;
DECLARE @InsertedRows int = 0;

BEGIN TRY
    BEGIN TRANSACTION;
    SET @TransactionStarted = 1;

    IF EXISTS
    (
        SELECT 1
        FROM dbo.TBL_MIS_CRM_BUSINESS_REQ AS target WITH (UPDLOCK, HOLDLOCK)
        JOIN #BusinessRequirements AS source
          ON RTRIM(CONVERT(nvarchar(4000), target.DOC_CODE)) = source.DOC_CODE
        WHERE CONVERT(nvarchar(4000), target.DOC_ID) <> CONVERT(nvarchar(4000), source.DOC_ID)
    )
        THROW 51006, 'A supplied DOC_CODE already belongs to a different DOC_ID. Resolve the conflict before loading.', 1;

    IF EXISTS
    (
        SELECT target.DOC_ID
        FROM dbo.TBL_MIS_CRM_BUSINESS_REQ AS target WITH (UPDLOCK, HOLDLOCK)
        GROUP BY target.DOC_ID
        HAVING COUNT(*) > 1
    )
        THROW 51007, 'The target table contains duplicate DOC_ID values and cannot be safely upserted.', 1;

    UPDATE target
       SET target.DOC_CODE = source.DOC_CODE,
           target.DOC_NAME = source.DOC_NAME,
           target.BUSINESS_TYPE = source.BUSINESS_TYPE,
           target.CLIENT = source.CLIENT,
           target.ACTIVE = source.ACTIVE,
           target.CODE = source.CODE
    FROM dbo.TBL_MIS_CRM_BUSINESS_REQ AS target
    JOIN #BusinessRequirements AS source
      ON target.DOC_ID = source.DOC_ID
    WHERE ISNULL(RTRIM(CONVERT(nvarchar(4000), target.DOC_CODE)), N'') <> source.DOC_CODE
       OR ISNULL(CONVERT(nvarchar(4000), target.DOC_NAME), N'') <> source.DOC_NAME
       OR ISNULL(CONVERT(nvarchar(4000), target.BUSINESS_TYPE), N'') <> source.BUSINESS_TYPE
       OR ISNULL(CONVERT(nvarchar(4000), target.CLIENT), N'') <> source.CLIENT
       OR ISNULL(CONVERT(nvarchar(4000), target.ACTIVE), N'') <> CONVERT(nvarchar(4000), source.ACTIVE)
       OR ISNULL(CONVERT(nvarchar(4000), target.CODE), N'') <> CONVERT(nvarchar(4000), source.CODE);

    SET @UpdatedRows = @@ROWCOUNT;

    IF @DocIdIsIdentity = 1
       AND EXISTS
       (
           SELECT 1
           FROM #BusinessRequirements AS source
           WHERE NOT EXISTS
           (
               SELECT 1
               FROM dbo.TBL_MIS_CRM_BUSINESS_REQ AS target WITH (UPDLOCK, HOLDLOCK)
               WHERE target.DOC_ID = source.DOC_ID
           )
       )
    BEGIN
        SET IDENTITY_INSERT dbo.TBL_MIS_CRM_BUSINESS_REQ ON;
        SET @IdentityInsertEnabled = 1;
    END;

    INSERT INTO dbo.TBL_MIS_CRM_BUSINESS_REQ
        (DOC_ID, DOC_CODE, DOC_NAME, BUSINESS_TYPE, CLIENT, ACTIVE, CODE)
    SELECT source.DOC_ID,
           source.DOC_CODE,
           source.DOC_NAME,
           source.BUSINESS_TYPE,
           source.CLIENT,
           source.ACTIVE,
           source.CODE
    FROM #BusinessRequirements AS source
    WHERE NOT EXISTS
    (
        SELECT 1
        FROM dbo.TBL_MIS_CRM_BUSINESS_REQ AS target WITH (UPDLOCK, HOLDLOCK)
        WHERE target.DOC_ID = source.DOC_ID
    );

    SET @InsertedRows = @@ROWCOUNT;

    IF @IdentityInsertEnabled = 1
    BEGIN
        SET IDENTITY_INSERT dbo.TBL_MIS_CRM_BUSINESS_REQ OFF;
        SET @IdentityInsertEnabled = 0;
    END;

    IF EXISTS
    (
        SELECT 1
        FROM #BusinessRequirements AS source
        LEFT JOIN dbo.TBL_MIS_CRM_BUSINESS_REQ AS target
          ON target.DOC_ID = source.DOC_ID
        WHERE target.DOC_ID IS NULL
           OR ISNULL(RTRIM(CONVERT(nvarchar(4000), target.DOC_CODE)), N'') <> source.DOC_CODE
           OR ISNULL(CONVERT(nvarchar(4000), target.DOC_NAME), N'') <> source.DOC_NAME
           OR ISNULL(CONVERT(nvarchar(4000), target.BUSINESS_TYPE), N'') <> source.BUSINESS_TYPE
           OR ISNULL(CONVERT(nvarchar(4000), target.CLIENT), N'') <> source.CLIENT
           OR ISNULL(CONVERT(nvarchar(4000), target.ACTIVE), N'') <> CONVERT(nvarchar(4000), source.ACTIVE)
           OR ISNULL(CONVERT(nvarchar(4000), target.CODE), N'') <> CONVERT(nvarchar(4000), source.CODE)
    )
        THROW 51008, 'Post-upsert row validation failed; the transaction will be rolled back.', 1;

    IF (SELECT COUNT(*) FROM dbo.TBL_MIS_CRM_BUSINESS_REQ WHERE DOC_ID BETWEEN 90 AND 134) <> 45
       OR (SELECT COUNT(DISTINCT DOC_CODE) FROM dbo.TBL_MIS_CRM_BUSINESS_REQ WHERE DOC_ID BETWEEN 90 AND 134) <> 45
       OR EXISTS
          (
              SELECT 1
              FROM dbo.TBL_MIS_CRM_BUSINESS_REQ
              WHERE DOC_ID BETWEEN 90 AND 134
                AND (BUSINESS_TYPE <> N'B' OR ACTIVE <> 1)
          )
       OR EXISTS
          (
              SELECT 1
              FROM dbo.TBL_MIS_CRM_BUSINESS_REQ
              WHERE DOC_ID BETWEEN 90 AND 101
                AND CLIENT <> N'R'
          )
       OR EXISTS
          (
              SELECT 1
              FROM dbo.TBL_MIS_CRM_BUSINESS_REQ
              WHERE DOC_ID BETWEEN 102 AND 134
                AND CLIENT <> N'C'
          )
        THROW 51009, 'Aggregate post-load validation failed; the transaction will be rolled back.', 1;

    COMMIT TRANSACTION;
    SET @TransactionStarted = 0;

    SELECT
        source.DOC_ID,
        source.DOC_CODE,
        source.DOC_NAME,
        source.BUSINESS_TYPE,
        source.CLIENT,
        source.ACTIVE,
        source.CODE,
        N'LOADED' AS LoadStatus
    FROM #BusinessRequirements AS source
    ORDER BY source.DOC_ID;

    SELECT
        MIN(DOC_ID) AS MinDocID,
        MAX(DOC_ID) AS MaxDocID,
        COUNT(*) AS RecordCount,
        COUNT(DISTINCT DOC_CODE) AS DistinctDocCodes,
        SUM(CASE WHEN BUSINESS_TYPE = N'B' THEN 1 ELSE 0 END) AS BusinessTypeBCount,
        SUM(CASE WHEN ACTIVE = 1 THEN 1 ELSE 0 END) AS ActiveCount,
        SUM(CASE WHEN DOC_ID BETWEEN 90 AND 101 AND CLIENT = N'R' THEN 1 ELSE 0 END) AS RetailCount,
        SUM(CASE WHEN DOC_ID BETWEEN 102 AND 134 AND CLIENT = N'C' THEN 1 ELSE 0 END) AS CorporateCount
    FROM dbo.TBL_MIS_CRM_BUSINESS_REQ
    WHERE DOC_ID BETWEEN 90 AND 134;

    SELECT
        @InsertedRows AS InsertedRows,
        @UpdatedRows AS UpdatedRows,
        45 - @InsertedRows - @UpdatedRows AS AlreadyMatchingRows;
END TRY
BEGIN CATCH
    IF @IdentityInsertEnabled = 1
    BEGIN
        BEGIN TRY
            SET IDENTITY_INSERT dbo.TBL_MIS_CRM_BUSINESS_REQ OFF;
        END TRY
        BEGIN CATCH
            -- Preserve the original load failure.
        END CATCH;
    END;

    IF @TransactionStarted = 1 AND XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;