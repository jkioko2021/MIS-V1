
Imports DocManage.DataManagement
Imports System.Data
Imports System.Data.SqlClient

Imports Telerik.Web.UI
Imports DocManage
Imports System.IO

Imports System.Data.OleDb
Imports System.Web.Configuration
Imports Mymail

Partial Class _Default
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            Session("EXCEL") = Nothing
            loadListBox()
        End If

    End Sub

    Private Sub loadListBox()
        Try
            Dim MyDatatable As DataTable : Dim Str As String

            Str = "SELECT Rpt_Code, Rpt_Name FROM [dbo].[MainReports] where Is_Active=1"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With MainRptRad
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("Rpt_Name").ToString
                .DataValueField = MyDatatable.Columns("Rpt_Code").ToString
                .DataBind()

            End With
            MyDatatable = Nothing

        Catch ex As Exception
            'LblErr.Text = ex.Message.ToString
            'Panel3.Visible = True
            'MyDBAction.DoLogs("Class==Standard_Reports.vb: Private Sub loadCombo()" & " : Error : " & ex.Message)
        End Try

    End Sub


    Protected Sub MainRptRad_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles MainRptRad.SelectedIndexChanged
        Try
            Dim MyDatatable As DataTable : Dim Str As String
            Str = MainRptRad.SelectedValue

            Str = "SELECT Sub_Rpt_Code,Sub_Rpt_Name  FROM [dbo].[Sub_Reports] where Is_Active=1 and Can_Access=1 AND Main_Rpt_Code ='" & Str & "'"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With SubRadRpt

                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("Sub_Rpt_Name").ToString
                .DataValueField = MyDatatable.Columns("Sub_Rpt_Name").ToString
                .DataBind()

            End With
            MyDatatable = Nothing

        Catch ex As Exception
            'LblErr.Text = ex.Message.ToString
            'Panel3.Visible = True
            'MyDBAction.DoLogs("Class==Standard_Reports.vb: Private Sub loadCombo()" & " : Error : " & ex.Message)
        End Try
    End Sub

    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        Try
            Dim Str As String = "" : Dim Mytable As DataTable = Nothing
            Dim Str_Live As String = ""
            Dim sp_name As String = ""
            Dim StrQuery As String = ""
            Dim Reportname As String = ""
            Dim SelectionFormula As String = ""
            Dim MemberNo As String = ""
            Dim MemberNo_Family As String = ""
            Dim QuotationNo As String = ""
            Dim InvoiceNo As String = ""
            Dim EntryDate_From As String = ""
            Dim ValidAsAT As String = ""
            Dim EntryDate_To As String = ""
            Dim PolicyDate_From As String = ""
            Dim PolicyDate_To As String = ""
            Dim ReceiptNo As String = ""
            Dim PolicyCode As String = ""
            Dim Proposer As String = ""
            Dim CorporateName As String = ""
            Dim ClaimNo As String = ""
            Dim Agency As String = ""
            Dim ClaimRegDate_From As String = ""
            Dim ClaimRegDate_To As String = ""
            Session("Mytable") = ""
            Session("EntryDate_From") = Nothing
            Session("EntryDate_To") = Nothing
            Session("MemberNo") = Nothing
            Session("PolicyDate_From") = Nothing
            Session("PolicyDate_To") = Nothing
            Session("EXCEL") = Nothing
            Session("FrmDT") = Nothing
            Session("ToDt") = Nothing

            Session("EXCEL") = "TO EXCEL"
           
            Session("Reportname") = Nothing
            If SubRadRpt.SelectedIndex <> -1 Then
                Reportname = SubRadRpt.SelectedValue
                Session("FrmDT") = dtDateFrom.DbSelectedDate
                Session("ToDt") = dtDateTo.DbSelectedDate

                Select SubRadRpt.SelectedValue
                    Case "Lapsed Members"
                        Str = "SELECT [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_FNAME],[MEMBER_LNAME],[FIRST_ENROLLMENT_DATE],CONVERT(varchar,[PERIOD_FROM],23)  [PERIOD_FROM], CONVERT(varchar,[PERIOD_TO],23)[PERIOD_TO],[MEMBERSHIP_STATUS],[AGENT],[POLICY_MONTH],[MEMBER_PRI_ADD_LINE1],[MEMBER_PRI_ADD_LINE2],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],[UNIT],[BRANCH],[REGION],[FORM_PREMIUM],[RENEWAL_DATETIME],[GRP_INDV], [PERIOD_FROM],[PERIOD_TO],[POLICY_STATUS],[CORPORATE_ID],[FAMILY_NO],[DATA_DATE],[RM_NAME],[CARD_TYPE],[ENDR_NO]  FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WHERE POLICY_STATUS='LAPSED'"
                    Case "Valid Member List"
                        Str = "SELECT [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_FNAME],[MEMBER_LNAME],[FIRST_ENROLLMENT_DATE],CONVERT(varchar,[PERIOD_FROM],23)  [PERIOD_FROM], CONVERT(varchar,[PERIOD_TO],23)[PERIOD_TO],[MEMBERSHIP_STATUS],[AGENT],[POLICY_MONTH],[MEMBER_PRI_ADD_LINE1],[MEMBER_PRI_ADD_LINE2],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],[UNIT],[BRANCH],[REGION],[FORM_PREMIUM],[RENEWAL_DATETIME],[GRP_INDV], [PERIOD_FROM],[PERIOD_TO],[POLICY_STATUS],[CORPORATE_ID],[FAMILY_NO],[DATA_DATE],[RM_NAME],[CARD_TYPE],[ENDR_NO]  FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WHERE POLICY_STATUS='ACTIVE'"
                    Case "Terminated Member List"
                        Str = "SELECT [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_FNAME],[MEMBER_LNAME],[FIRST_ENROLLMENT_DATE],CONVERT(varchar,[PERIOD_FROM],23)  [PERIOD_FROM], CONVERT(varchar,[PERIOD_TO],23)[PERIOD_TO],[MEMBERSHIP_STATUS],[AGENT],[POLICY_MONTH],[MEMBER_PRI_ADD_LINE1],[MEMBER_PRI_ADD_LINE2],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],[UNIT],[BRANCH],[REGION],[FORM_PREMIUM],[RENEWAL_DATETIME],[GRP_INDV], [PERIOD_FROM],[PERIOD_TO],[POLICY_STATUS],[CORPORATE_ID],[FAMILY_NO],[DATA_DATE],[RM_NAME],[CARD_TYPE],[ENDR_NO]  FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WHERE POLICY_STATUS='TERMINATED'"
                    Case "Suspended Member List"
                        Str = "SELECT [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_FNAME],[MEMBER_LNAME],[FIRST_ENROLLMENT_DATE],CONVERT(varchar,[PERIOD_FROM],23)  [PERIOD_FROM], CONVERT(varchar,[PERIOD_TO],23)[PERIOD_TO],[MEMBERSHIP_STATUS],[AGENT],[POLICY_MONTH],[MEMBER_PRI_ADD_LINE1],[MEMBER_PRI_ADD_LINE2],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],[UNIT],[BRANCH],[REGION],[FORM_PREMIUM],[RENEWAL_DATETIME],[GRP_INDV], [PERIOD_FROM],[PERIOD_TO],[POLICY_STATUS],[CORPORATE_ID],[FAMILY_NO],[DATA_DATE],[RM_NAME],[CARD_TYPE],[ENDR_NO]  FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WHERE POLICY_STATUS='SUSPENDED'"

                    Case "Renewal List"
                        Str = "SELECT +''''+ T.USER_ID USER_ID,   T.POLICY_CODE, T.PROPOSER_DISPLAY_NAME, T.MEMBER_NO,T.MEMBER_NAME, T.RELATION, T.SCHEME_NAME, T.MEMBER_BIRTH_DATE, T.MEMBER_ADMINISTRATIVE_SEX, T.FIRST_ENROLLMENT_DATE, T.MEMBER_PRI_ADD_LINE1,T.PROPOSER_PRI_PIN, +''''+ T.MEMBER_PRI_MOBILE MEMBER_PRI_MOBILE, T.MEMBER_PRI_EMAIL, T.PROPOSER_PRI_ADD_LINE1, T.ADDRESS,T.POSTAL_CODE, +''''+ T.PROPOSER_PRI_MOBILE PROPOSER_PRI_MOBILE, T.PROPOSER_PRI_EMAIL,T.PERIOD_FROM, T.PERIOD_TO, T.AGE,T.FAMILY_NO, T.AGE_BAND, T.LOADING_RATE,T.OP_LIMIT, T.IP_LIMIT, T.POLICY_TYPE,T.LAST_CLAIM_DATE, T.NCD_YEARS, T.NCD_RATE,T.IP_NET_NCD, T.OP_RATE, T.PA_PTD,T.SUB_TOTAL, T.LEVIES, T.TOTAL,T.IS_LOADING, V.AGENT_NAME, V.UM_MANAGER, V.REGION_NAME,V.REGION_MANAGER,v.RETAIL_RM RE_NAME FROM [DB_MASTER_RENEWAL].dbo.TBL_MIS_RENEWAL_LIST T left JOIN   [DB_MASTER_AGENTS].dbo.VW_MIS_AGENTS_LISTING V ON T.USER_ID = (V.USER_ID)  WHERE  T.PERIOD_FROM>= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND T.PERIOD_FROM<= '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND ON_HOLD=0 AND T.APPROVED=1"
                    Case "Renewal List-NonMed"
                        Str = "SELECT  +''''+[Agency_Code],[Agency],[Insured],[Policy_Number],[Expiry_Date],[Renewal_start_date],[Renewal_end_date],[RM_Name],[RM_Email],[Agent_Email],[Insured_email],[Claim_Amount],[Picked],[Verified],[Verified_by],[Renewed],[Collect_Status],[Sum_Insured],[Data_Date],[Total_Premium],[Basic_Premium],[Policy_Fund],[Training_Levy],[Policy_Type],+''''+[Insured_mobile_number],[Collect_Date]  FROM [COM_ACTIVITIES_DB].[dbo].[Renewal_Schedules_Non_Med] WHERE   Renewal_start_date>= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND  Renewal_start_date<= '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND verified=1"

                    Case "IP Register Listing"
                        'Str = "SELECT  BARCODE,[FILE_NO],[INVOICE_NO],[INVOICE_AMT],[CARE_MGR],[RECEIVE_DT],[ALLOCATED_DT],[RESOLVE_DT],[CLAIM_ACK_DT],PROVIDER_NAME,PROVIDER,[STATUS],COMMENT  FROM [MISREPORTS].[dbo].[VW_IP_INV_REGISTER] WHERE RECEIVE_DT BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"
                        Str = "SELECT [File_No],[Receive_dt],[Service_dt],[Claim_Type],[Member_No],[Member_Name],[Proposer],[Provider_Code],[Provider_Name],[Invoice_No],[Invoice_Amt],[Mobile_No],[Email],[Bar_code],[Inv_Status]," & _
                              "[Entry_Date],[Entered_by],[Submitted],[Submitted_By],[Submit_dt],[Discharged],[Discharge_DT],[Discharge_By],[Invoice_type],[Amt_Payable_Ben],[P_I_Amount],[Country],[Ready_To_Process],[Returned],[Returned_Dt],[Returned_By],[Allocated],[Allocate_Dt],[Allocate_To],[Allocate_By]," & _
                              "[Mship_User],[Mship_Issue],[Mship_Date],[Processed],[Process_Dt],[Processed_By],[Payable_Amt],[Inadmissable_Amt],[Audited],[Audit_Dt],[Audit_By],[Posting],[Posting_Date] FROM [CRM].[dbo].[TBL_MIS_IP_CLAIM_TRACKING]   WHERE Receive_dt>= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND  Receive_dt<= '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"

                    Case "IP Register Summary"
                        Str = "SELECT * FROM MISREPORTS.dbo.[VW_IP_INV_REGISTER_STATUS] "
                    Case "OP Register List"
                        Str = "SELECT [File_No] ,[Provider_Id] ,[Provider_name] ,[Invoice_no] ,[Invoice_Amt] ,[Email_Date] ,[Receive_Date] ,[Scan_date] ,[Index_Date] ,[Bar_Code] ,[Entered_By] ,[Entry_date]  ,[Closed]  FROM [CRM].[dbo].[TBL_MIS_OP_CLAIM_TRACKING] where ENTRY_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"
                    Case "Claim Rejections"
                        Str = "SELECT *  FROM [MISREPORTS].[dbo].[TBL_MIS_INVOICE_REJECTIONS] WHERE ENTRY_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"

                    Case "IP Register Resolved_TAT"
                        Str = "SELECT * FROM MISREPORTS.dbo.VW_IP_CARE_TAT "
                    Case "Complaints Report"

                        Str = "SELECT [Case_no],[Date_Received],[Member_No],[Member_Name],[Subject_Name], [SUB_AREA],[Time_Received],[Received_By],[Responded_By],[Time_Responded],[TAT_Hrs],[Case_Status],[Proposer_Name],[Client_type]  FROM [CRM].[dbo].[VW_MIS_CRM_COMPLAINTS] with(nolock) WHERE  Date_Received BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'order by Case_no"
                    Case "Claims Received Register"
                        Str = "SELECT * FROM MISREPORTS.dbo.VW_MIS_CLAIMS_REC_REGISTER WHERE RECEIVE_DT BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"

                    Case "Claims Extract"
                        If cboserver.SelectedValue = "B" Then
                            Str = "SELECT  [DISPLAY_MEMBERSHIP_NO],[PROVIDER_NAME],[ADMISSION_DATE],[DISCHARGE_DATE],[CLAIM_SUB_TYPE],[CLAIM_NO],[INVOICE_NO],[INVOICE_AMT],[BILL_STATUS],[PERIOD_FROM],[PERIOD_TO],[SERVER_NAME],[FAMILY_NO]  FROM [DATA_REPOSITORY_DB].[dbo].[TBL_SUMMARY_CLAIMS_DATA_BLUE] WHERE PROVIDER_NAME LIKE '%" & cboprovider.SelectedValue & "%'"
                        ElseIf cboserver.SelectedValue = "R" Then
                            Str = "SELECT  [DISPLAY_MEMBERSHIP_NO],[PROVIDER_NAME],[ADMISSION_DATE],[DISCHARGE_DATE],[CLAIM_SUB_TYPE],[CLAIM_NO],[INVOICE_NO],[INVOICE_AMT],[BILL_STATUS],[PERIOD_FROM],[PERIOD_TO],[SERVER_NAME],[FAMILY_NO]  FROM [DATA_REPOSITORY_DB].[dbo].[TBL_SUMMARY_CLAIMS_DATA_RED] WHERE PROVIDER_NAME LIKE '%" & cboprovider.SelectedValue & "%'"
                        ElseIf cboserver.SelectedValue = "C" Then
                            Str = "SELECT [m_ClaimNo],[m_ProviderNo],[m_MemberNo],[m_RefNo],[m_AuthNo],[m_ReceiveDt],[m_PaidDt],[m_PaidRefNo],[m_Status],[m_FromDt],[m_ToDt],[d_ClaimNo],[d_ClaimAmt]  FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_CLAIMS_HISTRY_CCA] WHERE m_ProviderNo LIKE '%" & cboprovider.SelectedValue & "%'"
                        End If
                    Case "Premium Refunds"
                        Str = "SELECT  [Refund_Id],[Refund_No],[File_No],[Debit_No],[Amount_Debited],[Amount_Paid],[Refund_Amt],Posted_Amt, [Payee_Name],[Payee_eMail],[Payee_Mobile],[Refund_Status],[Refund_Type],[Request_Dt],[Request_By],[Requested],[Allocated],[Allocate_Dt],[Allocate_To],[Processed],[Process_Dt],[Process_By],[Approved],[Approve_Dt],[Approved_By],[Verified],[Verified_by],[Verified_Dt],[Fin_Approved],[Fin_Approved_By],[Fin_Approved_Dt],[Finance_Processed],[Finance_Processed_By],[Finance_Process_Dt],[Ref_Paid],[Entered_By],[Entry_Dt],[Is_Active],[Client_Type]  FROM [CRM].[dbo].[TBL_MIS_BUSINESS_TRACKING_REFUNDS] where Is_Active=1 and Request_Dt BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"

                    Case "Invoiced Not_Receipted"
                        Str = "SELECT   [PROPOSER_DISPLAY_NAME],[BUSINESS_TYPE],[INVOICE_NO],[INVOICE_DATE],[PERIOD_FROM],[PERIOD_TO],[PREMIUM],[USER_DISPLAY_NAME]  FROM [DATA_REPOSITORY_DB].[dbo].[VW_MIS_DEBITED_NOT_RECEIPTED] where INVOICE_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"
                    Case "AML Report"
                        Str = "SELECT [Proposer_Name],[client_type],[allocated_to],[allocate_Dt],[eOx_Invoice_no],[AML_STATUS],[UPLOAD_BY],[DOC_DATE]  FROM [CRM].[dbo].[vw_MIS_CRM_AML_STATUS] where [allocate_Dt] BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "'"
                    Case "Returned Business"
                        Str = "select DISTINCT R.FILE_NO,T.PROPOSER_NAME,T.BUSINESS_TYPE,T.CLIENT_TYPE,T.PREMIUM,T.BUSINESS,R.RETURN_DATE,R.RETURNED_BY,R.RETURNED_TO,R.REASON,T.FILE_STATUS   FROM [TBL_MIS_CRM_RETURNED] R INNER JOIN [TBL_MIS_CRM_BUSINESS_TRACKING] T ON T.FILE_NO=R.FILE_NO  where T.is_active=1 AND R.return_date BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' ORDER BY R.FILE_NO"

                End Select

                If Str <> "" Then
                    Session("Mytable") = Nothing
                    Session("Reportname") = Nothing

                    Mytable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                    'Mytable = TryCast(MyDBAction.eoxegen(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                    Session("Mytable") = (Mytable)
                    Session("Reportname") = Reportname
                    ResponseHelper.Redirect("Reports.aspx", "_blank", "")
                    Mytable = Nothing

                    System.Threading.Thread.Sleep(5000)
                    'ElseIf Str_Live <> "" Then
                    '    Session("Mytable") = Nothing
                    '    Session("Reportname") = Nothing
                    '    Mytable = TryCast(MyDBAction.eoxegen_live(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                    '    'Mytable = TryCast(MyDBAction.eoxegen(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                    '    Session("Mytable") = (Mytable)
                    '    Session("Reportname") = Reportname
                    '    ResponseHelper.Redirect("Reports.aspx", "_blank", "")

                End If


            Else
                LblErr.Text = "Select a Report from the list provided."
                Panel3.Visible = True
                Exit Try
            End If


            Select Case SubRadRpt.SelectedValue
                Case "Member No" 'Account Information
                    LblErr.Text = "Select a Report from the list provided."

            End Select




        Catch ex As Exception
            LblErr.Text = ex.Message.ToString
            Panel3.Visible = True
            MyDBAction.DoLogs("Class==CRBReports.vb: Protected Sub RadRptFinalize_Click" & " : Error : " & ex.Message)
        End Try
    End Sub



    Protected Sub cboserver_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboserver.SelectedIndexChanged
        Dim MyDatatable As DataTable : Dim Str As String
        cboprovider.SelectedValue = ""
        cboprovider.Text = ""

        If cboserver.SelectedValue = "B" Then
            Str = "SELECT ORG_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_PROVIDER_LIST]  ORDER BY ORG_NAME"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboprovider
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("ORG_NAME").ToString
                .DataValueField = MyDatatable.Columns("ORG_NAME").ToString
                .DataBind()

            End With
            MyDatatable = Nothing
        ElseIf cboserver.SelectedValue = "R" Then
            Str = "SELECT ORG_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_PROVIDER_LIST] ORDER BY ORG_NAME"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboprovider
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("ORG_NAME").ToString
                .DataValueField = MyDatatable.Columns("ORG_NAME").ToString
                .DataBind()

            End With
            MyDatatable = Nothing
        ElseIf cboserver.SelectedValue = "C" Then
            Str = " SELECT m_providerno FROM [DATA_REPOSITORY_DB].MASTER_CCA_PROVIDERS ORDER BY m_providerno"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboprovider
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("m_providerno").ToString
                .DataValueField = MyDatatable.Columns("m_providerno").ToString
                .DataBind()

            End With
            MyDatatable = Nothing

        End If


    End Sub
End Class


