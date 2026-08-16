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
                Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='PROJECTS'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboAllocateto
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                    .DataValueField = MyDatatable.Columns("username").ToString
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
 
        SqlAction = "SELECT t.[File_No],[Proposer_Name],Forward_Date,Premium,File_Status,t.Business_Type,Client_Type,is_branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] t WITH (NOLOCK) inner join  [DATA_REPOSITORY_DB_CLAPI].[dbo].[MASTER_MEMBER_LIST_MAPPING] m on t.file_no=m.file_no WHERE Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R'  AND ALLOCATED=0  AND Business='M' AND  is_clapi=1 AND Is_Active=1 AND T.ENTRY_DATE<'2024-01-01' ORDER BY Id Asc"
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
    
    End Sub



    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        GD_DOCS.DataSource = Nothing
        GD_DOCS.DataBind()
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        Try

            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1"
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
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnforward_Click(sender As Object, e As System.EventArgs) Handles btnforward.Click
        Dim a_to As String = ""
        Dim VER As String = "NO"
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                Exit Sub
            End If
            If cboAllocateto.SelectedValue = "" And cboAction.SelectedValue = "A" Then
                lblerr.Text = "Select the Forward To!"
                Exit Sub
            End If
            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If
        

            'If Cbosyst.SelectedValue = "Clapi" And cboAction.SelectedValue = "MU" Then
            '    lblerr.Text = "You cannot allocate this Business to Medical UW"
            '    Exit Sub

            'End If

            If cboAction.SelectedValue = "RI" Then
                a_to = lblenteredby.Text
            Else
                a_to = cboAllocateto.SelectedValue
            End If
            If cboclient.SelectedValue = "C" Then
                cborateType.SelectedValue = "C"
            End If

            If cborateType.SelectedValue = "C" And (cboBusiness.SelectedValue = "R" Or cboBusiness.SelectedValue = "N") Then
                VER = "NO"
            Else
                VER = "YES"
            End If

            'UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  syst='" & Cbosyst.Text & "', Product='" & CboProd.Text & "'  where [File_No]= '" & FILE_NO.Text & "'")

            'If CboProd.SelectedValue = "S" Then
            '    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET syst='" & Cbosyst.Text & "', Product='" & CboProd.Text & "',Forwarded = 1,Ready_For_update = 1,Allocated = 1,Invoiced = 1,Receipted = 0,Is_Declined = 0,Paid = 1,Allocated_to= 'admin',[Allocate_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',Benefit_Verified='YES' where [File_No]= '" & FILE_NO.Text & "'")
            'ElseIf CboProd.SelectedValue = "T" Then
            '    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  syst='" & Cbosyst.Text & "', Product='" & CboProd.Text & "'  where [File_No]= '" & FILE_NO.Text & "'")
            'End If

            MyDBAction.TRACKING_ALLOCATION(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, VER)

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

            Str = "SELECT EMAIL FROM employees WHERE username='" & cboAllocateto.SelectedValue & "'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatatable.Rows.Count > 0 Then

                Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                'Session("msg") = "Kindly note that you have been Allocated the below Business for update.Please await for benefit verification."
            End If
            Session("to") = ""
            If cborateType.SelectedValue = "C" And cboAction.SelectedValue = "A" And (cboBusiness.SelectedValue = "R" Or cboBusiness.SelectedValue = "N") Then
                Session("to") = cboAllocateto.Text
                'MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
                Session("to") = "Pricing Team"
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Allocated=1,   File_Status='ALLOCATED'  where [File_No]= '" & FILE_NO.Text & "'")
                'Session("msg") = "Kindly note that the above client has been Allocated to  '" & cboAllocateto.Text & "' for update.Kindly verify the benefits and attach Approved rate matrix!"
                'MailSent = SendLoginDetails("Pricing Team", "Quotations@aar.co.ke", Session("cc_email"))

            ElseIf cboAction.SelectedValue = "A" And (cboBusiness.SelectedValue <> "R" Or cboBusiness.SelectedValue <> "N") Then
                Session("to") = cboAllocateto.Text
                'Session("msg") = "Kindly note that the above client has been Allocated to  '" & cboAllocateto.Text & "' for update"
                'MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
            ElseIf cboAction.SelectedValue = "RI" Then
                Session("email") = Session("cc_email")
                Session("to") = lblenteredby.Text
                'Session("msg") = "Kindly note that the above business has been returned as Incomplete From membership!"
                'MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
            ElseIf cboAction.SelectedValue = "MU" Then
                Session("to") = "Medical Team"
                Session("email") = "medicalunderwriting@aar.co.ke"
                'Session("msg") = "Kindly note that the above business has been submitted for medical vetting"
                'MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
            End If

            'Session("email") = "jmwaniki@aar.co.ke"

            lblerr.Text = "Business updated successfully!"
            loadGrid_N()
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

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

    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            ltEmbed.Text = ""
            HiddenField1.Value = 1
            Session("Is_Branch") = 0
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Receive_dt,entered_By,Agent_id,  Client_Type,Is_Mtiba,Rate_Type,Is_IPF,Is_Branch   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
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
                cborateType.SelectedValue = MyDatable.Rows(0).Item("Rate_Type").ToString()
                chkipf.Checked = MyDatable.Rows(0).Item("Is_IPF").ToString()

                loadGrid(FILE_NO.Text)

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("cc_email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                Else
                    Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" & lblenteredby.Text & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("cc_email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                    Else
                        Session("cc_email") = "relationship-managers@aar.co.ke"
                    End If

                End If
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            ltEmbed.Text = ""
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT t.[File_No],[Proposer_Name],Forward_Date,Premium,File_Status,t.Business_Type,Client_Type,is_branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] t WITH (NOLOCK) inner join  [DATA_REPOSITORY_DB_CLAPI].[dbo].[MASTER_MEMBER_LIST_MAPPING] m  WITH (NOLOCK) on t.file_no=m.file_no WHERE Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R'  AND   Business='M' AND  is_clapi=1 AND Is_Active=1   and t.[File_No] Like '%" & Trim(txtsearch.Text.ToUpper) & "%'"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT t.[File_No],[Proposer_Name],Forward_Date,Premium,File_Status,t.Business_Type,Client_Type,is_branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] t WITH (NOLOCK) inner join  [DATA_REPOSITORY_DB_CLAPI].[dbo].[MASTER_MEMBER_LIST_MAPPING] m  WITH (NOLOCK) on t.file_no=m.file_no WHERE Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R'  AND   Business='M' AND  is_clapi=1 AND Is_Active=1   and t.Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'"
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

    Protected Sub cboAction_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboAction.SelectedIndexChanged
        cboAllocateto.SelectedValue = ""
        If cboAction.SelectedValue = "RI" Then
            cboAllocateto.Enabled = False

        ElseIf cboAction.SelectedValue = "A" Then
            cboAllocateto.Enabled = True
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='PROJECTS'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboAllocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        End If

    End Sub
    

    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        cboclient.Enabled = True
        cboBusiness.Enabled = True
    End Sub
 
    'Protected Sub GDTracking_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTracking.ItemDataBound
    '    If TypeOf e.Item Is GridDataItem Then
    '        Dim dataItem As GridDataItem = e.Item
    '        Dim myCell As TableCell = dataItem("Is_Clapi")
    '        If myCell.Text = 1 Then
    '            dataItem.BackColor = Drawing.Color.Chocolate
    '        End If
    '    End If
    'End Sub

    Protected Sub RadButton2_Click(sender As Object, e As System.EventArgs) Handles RadButton2.Click
        Try
            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Business_type='" & cboBusiness.SelectedValue & "', Rate_type='" & cborateType.SelectedValue & "', Client_Type='" & cboclient.SelectedValue & "'  where [File_No]= '" & FILE_NO.Text & "'")
            lblerr.Text = "Saved Successful"
            loadGrid_N()
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub

End Class
