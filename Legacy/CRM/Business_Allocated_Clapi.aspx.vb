Imports System.Data
Imports DocManage.DataManagement

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
    Dim SqlAction As String = ""
    Dim MyDatatable As DataTable : Dim Str As String
    Dim AB As Integer
    Dim MailSent As Boolean = False
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                dtreceivedate.DbSelectedDate = Date.Now
                dtreceivedate.Enabled = False
                ltEmbed.Text = ""
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing

           
                Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS WHERE ACTIVE=1  ORDER BY AGENT_NAME" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboagent
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("AGENT_NAME").ToString
                    .DataValueField = MyDatatable.Columns("USER_ID").ToString
                    .DataBind()
                End With

                loadGrid_N()

                txtProposer.Enabled = False
                txtFamily.Enabled = False
                dtreceivedate.Enabled = False
                txtpremium.Enabled = False
                cboBusiness.Enabled = False
                cboclient.Enabled = False

            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
       
        GDTracking.DataSource = Nothing
        GDTracking.DataBind()

        SqlAction = "SELECT Product,Syst, [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,WALK_IN_CLIENT,Allocate_Dt,Lateral_Movement,Is_Branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1  AND Allocated_to='" & Session("username") & "' AND ALLOCATED=1 AND INVOICED=0  AND Is_Active=1 ORDER BY  Allocate_Dt ASC"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDTracking.DataSource = MyDatable
            GDTracking.DataBind()
            Session("DAD_T") = MyDatable

            MyDatable = Nothing
        Else
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
        End If


        'SqlAction = "SELECT  [Refund_No],[File_No],[Amount_Paid],[Refund_Amt] ,[Payee_Name],[Payee_eMail],[Payee_Mobile],[Refund_Status],[Refund_Type],[Request_Dt],Entered_By,Client_Type FROM [CRM].[dbo].[TBL_MIS_BUSINESS_TRACKING_REFUNDS] WITH (NOLOCK) WHERE Requested=1 and Allocated =1 and Processed=0 and Allocate_To='" & Session("username") & "'  AND Is_Active=1"
        'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        'If MyDatable.Rows.Count > 0 Then
        '    GDTrackingRef.DataSource = MyDatable
        '    GDTrackingRef.DataBind()
        '    'Session("DAD_T") = MyDatable
        '    MyDatable = Nothing

        'Else
        '    GDTrackingRef.DataSource = Nothing
        '    GDTrackingRef.DataBind()
        'End If

        'SqlAction = "SELECT [File_No],[Proposer_Name],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,WALK_IN_CLIENT,Allocate_Dt   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1  AND Allocated_to='" & Session("username") & "' AND ALLOCATED=1 AND INVOICED=1 AND [Receipted]=1 AND  Policy_Returned=0 AND updated=0 AND Is_Declined=0 and Syst='Clapi'"
        'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        'If MyDatable.Rows.Count > 0 Then
        '    GDbranch.DataSource = MyDatable
        '    GDbranch.DataBind()
        '    'Session("DAD_B") = MyDatable
        '    MyDatable = Nothing
        'Else
        '    GDbranch.DataSource = Nothing
        '    GDbranch.DataBind()
        'End If
    End Sub



    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        GD_DOCS.DataSource = Nothing
        GD_DOCS.DataBind()
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        Try

            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By],Doc_Ref FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DOCS.DataSource = MyDatable
                GD_DOCS.DataBind()
                MyDatable = Nothing
            Else
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
            End If

            'Notes
            SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WHERE  File_No ='" & STR & "'  AND ACTIVE=1 ORDER BY Note_id DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
                MyDatable = Nothing
            Else
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
            End If
            SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Pay_Ref_No='" & Trim(txtrefno.Text) & "'  AND Is_Active=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Pay.DataSource = MyDatable
                GD_Pay.DataBind()
                txtpaid.Text = Convert.ToInt32(MyDatable.Compute("sum(Paid_Amt)", String.Empty))
                MyDatable = Nothing
            Else
                GD_Pay.DataSource = Nothing
                GD_Pay.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnforward_Click(sender As Object, e As System.EventArgs) Handles btnforward.Click
        Dim a_to As String = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If (Len(Trim(txtinv.Text)) > 25 Or Len(Trim(txtinv.Text)) < 20) And (cboAction.SelectedValue = "C") Then
                lblerr.Text = "Enter a Correct Invoice No."
                txtinv.Focus()
                txtinv.BackColor = Drawing.Color.Red
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                cboAction.Focus()
                cboAction.BackColor = Drawing.Color.Red
                Exit Sub
            End If
            If cboAction.SelectedValue = "C" And Trim(txtinv.Text) = "" Then
                lblerr.Text = "Enter the Invoice No."
                txtinv.Focus()
                txtinv.BackColor = Drawing.Color.Red
                Exit Sub
            End If
            If txtpolicy.Text = "" Then
                lblerr.Text = "Enter the Policy No!"
                cboAction.Focus()
                cboAction.BackColor = Drawing.Color.Red
                Exit Sub
            End If

            'MyDBAction.TRACKING_ALLOCATION_MSHIP(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, Trim(txtinv.Text))
            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoiced=1,eOx_Invoice_no='" & Trim(txtinv.Text) & "'  where [File_No]= '" & FILE_NO.Text & "'")
            UpdateRecord("UPDATE [DATA_REPOSITORY_DB_CLAPI].[dbo].[MASTER_MEMBER_LIST_MAPPING] SET EOX_INV_NO='" & Trim(txtinv.Text) & "',Eox_POLICY_NO='" & Trim(txtpolicy.Text) & "'  where [File_No]= '" & FILE_NO.Text & "'")

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd hh:mm"), txtcomment.Text)
            End If
            'Session("email") = "jmwaniki@aar.co.ke"
            'MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("email_cc"))
            lblerr.Text = "Business updated successfully!"
            loadGrid_N()
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    Protected Sub DownloadFile(sender As Object, e As EventArgs)
        ltEmbed.Text = ""
        Dim id As Integer = Integer.Parse(TryCast(sender, LinkButton).CommandArgument)
        Dim embed As String = "<object data=""{0}{1}"" type=""application/pdf"" width=""1000px"" height=""600px"">"
        embed += "If you are unable to view file, you can download from <a href = ""{0}{1}&download=1"">here</a>"
        embed += " or download <a target = ""_blank"" href = ""{0}{1}&download=1"">Adobe PDF Reader</a> to view the file."
        embed += "</object>"
        ltEmbed.Text = String.Format(embed, ResolveUrl("~/FileDoc.ashx?Id="), id)
    End Sub

    Protected Sub GDSEARCH_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDTracking.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("DOC_ID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""

            DeleteRecord("DELETE FROM   [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS]  WHERE DOC_ID='" & HiddenField1.Value.ToString & "' AND Upload_By='" & Session("UserName").ToString & "'")
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Tracking Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".", _
           Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            HiddenField1.Value = ""

            'ResetDisplayed("NewRecord")
            lblerr.Text = "Record Deleted!"
            'CmdSave.Enabled = False

            loadGrid_N()
            loadGrid(HiddenField1.Value.ToString)

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            ltEmbed.Text = ""
            Dim LBL As String
            HiddenField1.Value = 1
       
            GD_PROTECT.DataSource = Nothing
            GD_PROTECT.DataBind()
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],Pay_Ref_No,Paid_Amt,[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Receive_dt,entered_By,Agent_id,  Client_Type,Is_Mtiba,Benefit_verified,Benefit_Ver_by,Allocated_to,WALK_IN_CLIENT,eOx_Invoice_No,Is_Declined,Lateral_Movement   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                txtProposer.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                txtFamily.Text = MyDatable.Rows(0).Item("Family_code").ToString()
                dtreceivedate.DbSelectedDate = MyDatable.Rows(0).Item("Receive_dt").ToString()
                txtpremium.Text = MyDatable.Rows(0).Item("Premium").ToString()
                cboBusiness.SelectedValue = MyDatable.Rows(0).Item("Business_Type").ToString()
                cboclient.SelectedValue = MyDatable.Rows(0).Item("Client_Type").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                chkmtiba.Checked = MyDatable.Rows(0).Item("Is_Mtiba").ToString()
                cboagent.SelectedValue = MyDatable.Rows(0).Item("Agent_id").ToString()
                LBLBEN.Text = MyDatable.Rows(0).Item("Benefit_verified").ToString()
                txtrefno.Text = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                txtreceiptamt.Text = MyDatable.Rows(0).Item("Paid_Amt").ToString()
                txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                Session("Declined") = MyDatable.Rows(0).Item("Is_Declined").ToString()
                chkwaiver.Checked = MyDatable.Rows(0).Item("Lateral_Movement").ToString()

                loadGrid(FILE_NO.Text)

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email_CC") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                Else
                    Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" & lblenteredby.Text & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("email_CC") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                    Else
                        Session("email_CC") = "relationship-managers@aar.co.ke"
                    End If

                End If

                SqlAction = "SELECT [ID_Number],[Application_ID],[Name],[View_Certificate],[KRA_Pin],[File_Status],[Gender],[Email],[Phone],[Period],[Dob],[Date of Vaccination],[Agent_Name],[Agent_Phone],[Next_of_Kin],[Payment_Unique_ID],[Limit],[Premium_Amount],[Amount_Paid],[Balance],[Amount_To_Pay],[Status],[Application_Date],[Cover_Start_Date],[Cover_ End_Date]  FROM [AAR_Protect].[dbo].[Application_Detail] WITH (NOLOCK) WHERE Payment_Unique_ID='" & Trim(FILE_NO.Text) & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GD_PROTECT.DataSource = MyDatable
                    GD_PROTECT.DataBind()

                    MyDatable = Nothing
                Else
                    GD_PROTECT.DataSource = Nothing
                    GD_PROTECT.DataBind()
                End If

            End If
            'If LBLBEN.Text = "NO" Then
            '    btnforward.Enabled = False
            '    txtcomment.Enabled = False
            'Else
            '    btnforward.Enabled = True
            '    txtcomment.Enabled = True
            'End If



        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            ltEmbed.Text = ""
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,Allocate_Dt  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=0 AND  Is_Declined=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,Allocate_Dt  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=0 AND Is_Declined=0  AND Is_Active=1"
            End If
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDTracking.DataSource = MyDatable
                GDTracking.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDTracking.DataSource = Nothing
                GDTracking.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    
  

    Protected Sub GDTracking_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTracking.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("WALK_IN_CLIENT")
            If myCell.Text = "Y" Then
                dataItem.BackColor = Drawing.Color.Green
            End If


            myCell = dataItem("Lateral_Movement")
            If myCell.Text = "1" Then
                dataItem.BackColor = Drawing.Color.LightBlue
                'dataItem.ForeColor = Drawing.Color.Red
            End If
            Dim myCell_1 As TableCell = dataItem("Syst")

            If myCell_1.Text = "Clapi" Then
                dataItem.BackColor = Drawing.Color.PaleGreen
                'dataItem.ForeColor = Drawing.Color.Red
            End If
            Dim myCell_2 As TableCell = dataItem("Syst")

            If myCell_2.Text = "Shwaari" Then
                dataItem.BackColor = Drawing.Color.Green
                'dataItem.ForeColor = Drawing.Color.Red
            End If
        End If
    End Sub


    Protected Sub cmdview_Click(sender As Object, e As System.EventArgs) Handles cmdview.Click
        Try
            GDPROP.DataSource = Nothing
            GDPROP.DataBind()
            GDMEM.DataSource = Nothing
            GDMEM.DataBind()
            Dim MyDatable As New Data.DataTable
            ' SqlAction = "SELECT[PROPOSER_ID],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],[USER_ID] FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST]  WHERE PROPOSER_ID ='" & PRD.Text & "' order by DISPLAY_MEMBERSHIP_NO"
            If cbotype.SelectedValue = "R" Then
                If cbosearch_1.SelectedValue = "F" Then
                    SqlAction = "SELECT FAMILY_NO, [PROPOSER_ID],POLICY_CODE,PROPOSER_DISPLAY_NAME ,AGENT,POLICY_VALID_FROM [PERIOD_FROM],POLICY_VALID_UPTO PERIOD_TO,POLICY_STATUS,RM_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST]   WITH (NOLOCK)  WHERE ltrim(rtrim(FAMILY_NO))  ='" & Trim(TXTSEARCH_1.Text) & "' AND RELATION='MAIN MEMBER'"
                ElseIf cbosearch_1.SelectedValue = "PN" Then
                    SqlAction = "SELECT FAMILY_NO,[PROPOSER_ID],POLICY_CODE,PROPOSER_DISPLAY_NAME ,AGENT,POLICY_VALID_FROM [PERIOD_FROM],POLICY_VALID_UPTO PERIOD_TO,POLICY_STATUS,RM_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WITH(NOLOCK)  WHERE PROPOSER_DISPLAY_NAME  LIKE '%" & Trim(TXTSEARCH_1.Text) & "%'  AND RELATION='MAIN MEMBER'"
                ElseIf cbosearch_1.SelectedValue = "PC" Then
                    SqlAction = "SELECT FAMILY_NO,[PROPOSER_ID],POLICY_CODE,PROPOSER_DISPLAY_NAME ,AGENT,POLICY_VALID_FROM [PERIOD_FROM],POLICY_VALID_UPTO PERIOD_TO,POLICY_STATUS,RM_NAME FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WITH(NOLOCK)  WHERE  POLICY_CODE  = '" & Trim(TXTSEARCH_1.Text) & "'"
                Else
                    lblerr.Text = "Invalid Search type!"
                End If

            Else
                If cbosearch_1.SelectedValue = "PN" Then
                    SqlAction = "SELECT DISTINCT PROPOSER_ID,POLICY_CODE,PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,RM_NAME,POLICY_STATUS FROM [DATA_REPOSITORY_DB].[dbo].MASTER_PROPOSER_LIST WITH (NOLOCK)  WHERE PROPOSER_DISPLAY_NAME LIKE '%" & Trim(TXTSEARCH_1.Text) & "%' AND POLICY_STATUS<>'TERMINATED'"

                ElseIf cbosearch_1.SelectedValue = "PC" Then
                    SqlAction = "SELECT DISTINCT PROPOSER_ID,POLICY_CODE,PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,RM_NAME,POLICY_STATUS FROM [DATA_REPOSITORY_DB].[dbo].MASTER_PROPOSER_LIST WITH (NOLOCK)  WHERE POLICY_CODE = '" & Trim(TXTSEARCH_1.Text) & "' AND POLICY_STATUS<>'TERMINATED'"

                Else
                    lblerr.Text = "Invalid Search type!"
                End If
            End If

            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDPROP.DataSource = MyDatable
                GDPROP.DataBind()
                Session("TAT_5") = MyDatable
                'RMNAME.Text = MyDatable.Rows(0).Item("RM_NAME").ToString
                MyDatable = Nothing
            Else
                GDPROP.DataSource = Nothing
                GDPROP.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub GDPROP_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDPROP.SelectedIndexChanged
        Try
            GDMEM.DataSource = Nothing
            GDMEM.DataBind()
            Session("POLICY_CODE") = Nothing

            Session("FAMILY_NO") = Nothing
            Session("PERIOD_FROM") = Nothing
            Session("PERIOD_TO") = Nothing
            Dim DR As Decimal = 0
            Dim CR As Decimal = 0

            Session("POLICY_CODE") = (DirectCast(GDPROP.SelectedItems(0), GridDataItem)).GetDataKeyValue("POLICY_CODE").ToString()

            SqlAction = "SELECT [POLICY_CODE],[DISPLAY_MEMBERSHIP_NO],FAMILY_NO,MEMBER_PREFIX,[MEMBER_NAME],FIRST_ENROLLMENT_DATE,[RELATION],[SCHEME_NAME],[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL],POLICY_VALID_FROM ,POLICY_VALID_UPTO ,POLICY_STATUS,DATA_DATE,PERIOD_FROM,PERIOD_TO,ID_DOC_NO FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST]  with(nolock) WHERE POLICY_CODE ='" & Session("POLICY_CODE") & "'   order by DISPLAY_MEMBERSHIP_NO"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDMEM.DataSource = MyDatable
                GDMEM.DataBind()
                Session("TAT_5") = MyDatable
                Session("POLICY_CODE") = MyDatable.Rows(0).Item("POLICY_CODE").ToString()
                LBLID.Text = MyDatable.Rows(0).Item("POLICY_CODE").ToString

                Session("PERIOD_FROM") = MyDatable.Rows(0).Item("PERIOD_FROM").ToString
                Session("PERIOD_TO") = MyDatable.Rows(0).Item("PERIOD_TO").ToString
                MyDatable = Nothing
            Else
                GDMEM.DataSource = Nothing
                GDMEM.DataBind()
            End If


        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    'Public Sub LoadNotes(ByVal id As String)
    '    SqlAction = "SELECT [Note_id],[Notes],[Notes_by],[Note_Date],[Note_Type] FROM  [DATA_REPOSITORY_DB].[dbo].[MASTER_RET_MEMBER_NOTES] WHERE  proposer_id ='" & id & "'  ORDER BY Note_id DESC"
    '    MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
    '    If MyDatable.Rows.Count > 0 Then
    '        GDNOTES.DataSource = MyDatable
    '        GDNOTES.DataBind()
    '        MyDatable = Nothing
    '    Else
    '        GDNOTES.DataSource = MyDatable
    '        GDNOTES.DataBind()
    '    End If
    'End Sub


    Protected Sub GDMEM_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDMEM.SelectedIndexChanged
        Try
            Dim number As String = ""

            number = (DirectCast(GDMEM.SelectedItems(0), GridDataItem)).GetDataKeyValue("DISPLAY_MEMBERSHIP_NO").ToString()



        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub

    Protected Sub cmdview_1_Click(sender As Object, e As System.EventArgs) Handles cmdview_1.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String = "Member_" & Session("POLICY_CODE") & ""
        Try
            SqlAction = "SELECT  [POLICY_CODE],[PROPOSER_DISPLAY_NAME],[DISPLAY_MEMBERSHIP_NO],[MEMBER_NAME],[RELATION],[SCHEME_NAME],FORMAT(MEMBER_BIRTH_DATE, 'dd/MMM/yyyy')[MEMBER_BIRTH_DATE],[MEMBER_ADMINISTRATIVE_SEX],[MEMBER_FNAME],[MEMBER_LNAME],FORMAT (FIRST_ENROLLMENT_DATE, 'dd/MMM/yyyy ')[FIRST_ENROLLMENT_DATE],[POLICY_VALID_FROM],[POLICY_VALID_UPTO],[AGENT],[MEMBER_PRI_ADD_LINE1],[MEMBER_PRI_ADD_LINE2],+''''+ [MEMBER_PRI_MOBILE] [MEMBER_PRI_MOBILE],[MEMBER_PRI_EMAIL] ,[PERIOD_FROM],[PERIOD_TO],[POLICY_STATUS],[FAMILY_NO],[DATA_DATE],[ID_DOC_NO],[CARD_TYPE],[MEMBER_PIN],[COVER_TYPE] FROM [DATA_REPOSITORY_DB].[dbo].[MASTER_MEMBER_LIST] WITH(NOLOCK) where POLICY_STATUS<>'TERMINATED'  AND POLICY_CODE='" & Session("POLICY_CODE") & "'"
            Session("EXCEL") = "TO EXCEL"
            Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
            'Reportname = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub GDTracking_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDTracking.NeedDataSource

    End Sub

    Protected Sub txtcomment_TextChanged(sender As Object, e As System.EventArgs) Handles txtcomment.TextChanged

    End Sub

    Protected Sub Button1_Click(sender As Object, e As EventArgs) Handles Button1.Click

    End Sub
End Class
