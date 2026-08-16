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
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                HiddenField1.Value = 0
                ltEmbed.Text = ""
                Session("empcode") = Nothing
                Session("agentemail") = Nothing

                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Policy_RM_Ack  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE  Business='M' AND Policy_Approved=1 AND Policy_Verified=1 AND Policy_Signed=1 and Policy_Dispatched=0  AND  Is_Active=1 and Entered_by='" & Session("username") & "'"
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
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1 and Doc_Code='RET36' "
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
        lblerr.Text = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                Exit Sub
            End If

            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If

            'If txtfamilycode.Text = "" Or (Left(txtfamilycode.Text, 2) <> "AK" Or Left(txtfamilycode.Text, 2) <> "KE" Or Len(txtfamilycode.Text) > 10) Then
            '    lblerr.Text = "Enter Correct family Code!"
            '    txtfamilycode.Focus()

            '    Exit Sub
            'End If
            If cboAction.SelectedValue = "D" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  File_Status='POLICY DISPATCHED', Policy_Dispatched=1, [Policy_Disp_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',Dispatch_By='" & Session("username") & "' where [File_No]='" & FILE_NO.Text & "'")

                Session("to") = lblupdateby.Text
                Session("email") = Session("email")
                Session("email_cc") = ""
                Session("msg") = "Kindly note that the above Policy schedule has been verified Ready for Dispatch!"
            End If

            'MyDBAction.TRACKING_ALLOCATION_POLICYSIGN(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), cboAllocateto.SelectedValue, txtcomment.Text, cboAction.SelectedValue, Trim(txtfamilycode.Text))

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If
            lblerr.Text = "Business updated successfully!"
            loadGrid_N()
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            ltEmbed.Text = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

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


    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            ltEmbed.Text = ""
            HiddenField1.Value = 1
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],entered_By,Allocated_to,eOx_Invoice_No,Policy_Code,Family_Code   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                policy.Text = MyDatable.Rows(0).Item("Policy_Code").ToString()
                'txtfamilycode.Text = MyDatable.Rows(0).Item("Family_Code").ToString()
                loadGrid(FILE_NO.Text)

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblupdateby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                End If
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try

            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Policy_RM_Ack  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & txtretail1.Text & "%' AND  [Policy_Signed]=1 AND Policy_Approved=1 and Policy_Verified=1  and Business='M'  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Policy_RM_Ack  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & txtretail1.Text & "%'  AND [Policy_Signed]=1 and Policy_Approved=1 and Policy_Verified=1   and Business='M'  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "C" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Policy_RM_Ack  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Family_Code Like '%" & txtretail1.Text & "%'  AND  [Policy_Signed]=1 and Policy_Approved=1 and Policy_Verified=1   and Business='M'  AND Is_Active=1"
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


End Class
