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
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                ltEmbed.Text = ""

              

                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE  Policy_Approved=1 and [Policy_Signed]=1 and Policy_Dispatched=0 AND Filed=0 AND Is_Declined=0  AND Is_Active=1 and entered_by='" & Session("username") & "'"
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
            If cboAction.SelectedValue = "R" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET File_Status='RECEIPTED',Policy_Generated=0,Updated=0,Policy_Verified=0,Policy_Approved=0 where [File_No]='" & FILE_NO.Text & "'")
            Else
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  File_Status='UPDATED & DISPATCHED',Policy_Dispatched=1,Dispatch_By='" & Session("username") & "', Dispatch_To='" & lblrm.Text & "', Policy_Disp_Dt='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "' where [File_No]='" & FILE_NO.Text & "'")
                Session("msg") = "Kindly note that the Policy Document for above  client has been Dispatched for collection."
                'Session("msg") = "Kindly note that the Policy Document for above  client has been Dispatched for collection.You can  Download the Policy Schedule on the Policy Acknowledgement link and forward to the client"

                MailSent = SendLoginDetails(lblenteredby.Text, "relationship-managers@aar.co.ke", lblemail.Text)
            End If


            'MyDBAction.TRACKING_ALLOCATION_POLICYSIGN(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), cboAllocateto.SelectedValue, txtcomment.Text, cboAction.SelectedValue)

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
            HiddenField1.Value = 1
            ltEmbed.Text = ""
            lblemail.Text = ""
            Session("email_CC") = ""
            Dim agent As String = ""
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT Agent_Id,[File_No],entered_By,Allocated_to,eOx_Invoice_No,Family_code,Policy_code,Client_Type,Proposer_Name   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                'txtfamily.Text = MyDatable.Rows(0).Item("Family_code").ToString()
                policy.Text = MyDatable.Rows(0).Item("Policy_code").ToString()
                agent = MyDatable.Rows(0).Item("Agent_Id").ToString()
                lblprop.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                cboclient.SelectedValue = MyDatable.Rows(0).Item("Client_Type").ToString()
                loadGrid(FILE_NO.Text)

                If cboclient.SelectedValue = "R" Then
                    Str = "SELECT AGENT_NAME,RE_NAME FROM  [dbo].[VW_MIS_CRM_RM_AGENT_MAP_RET] WHERE USER_ID='" & agent & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        lblrm.Text = MyDatatable.Rows(0).Item("RE_NAME").ToString()
                        lblagent.Text = MyDatatable.Rows(0).Item("AGENT_NAME").ToString()
                    End If
                Else
                    Str = "SELECT AGENT_NAME,RE_NAME FROM  [dbo].[VW_MIS_CRM_RM_AGENT_MAP_CORP] WHERE USER_ID='" & agent & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        lblrm.Text = MyDatatable.Rows(0).Item("RE_NAME").ToString()
                        lblagent.Text = MyDatatable.Rows(0).Item("AGENT_NAME").ToString()
                    End If
                End If

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email_CC") = MyDatatable.Rows(0).Item("EMAIL").ToString()

                End If

                Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email_CC") = MyDatatable.Rows(0).Item("EMAIL").ToString()

                End If
                lblemail.Text = Session("email_CC")


            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try

            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & txtretail1.Text & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=1 AND Policy_Generated=1 and [Policy_Signed]=1 and Policy_Dispatched=0 AND  Is_Declined=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & txtretail1.Text & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=1 AND Policy_Generated=1 and [Policy_Signed]=1 and Policy_Dispatched=0 AND Is_Declined=0  AND Is_Active=1"
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
    Public Function SendLoginDetails(ByVal EmployeeName As String, ByVal RecepientEmail As String, ByVal ccemail As String) As Boolean

        Dim MailSent As Boolean = False
        Dim strMailFromEmail As String = ""
        Dim strMailFromName As String = ""
        Dim MessageSubject As String = ""
        Dim MySqlAction As String = ""
        Dim MyDBAction As New DataManagement
        Dim MyDataTable As New Data.DataTable
        Dim MyEncryption As New SysSettsEncryption
        Dim LoginFromEmail As String = ""
        Dim LoginDisplayName As String = ""
        Dim LoginSubject As String = ""
        Dim EmailServer As String = ""
        Dim EmailUserName As String = ""
        Dim EmailPassword As String = ""
        Dim action As String = ""

        Try ''--Retrieve settings from db n decrypt - Mercy - 12th Apr 2011
            LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail").Trim()
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
            LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
            'LoginSubject = "BUSINESS ALLOCATION"
            EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
            EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername").Trim()
            EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword").Trim()

            Dim strHTML As New StringBuilder
            strHTML = strHTML.Append("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>")
            strHTML = strHTML.Append("<html xmlns='http://www.w3.org/1999/xhtml' >")
            strHTML = strHTML.Append("<head>")
            strHTML = strHTML.Append("</head>")
            strHTML = strHTML.Append("<body>")
            strHTML = strHTML.Append("<table style='width: 668px'>")
            strHTML = strHTML.Append("<tr>")

            strHTML = strHTML.Append("<td colspan='3'>")
            'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'> Attention:Relationship Managers")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear:" & lblrm.Text & " </u></b> </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = "'" & lblprop.Text & "-" & FILE_NO.Text & " ' "
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & Session("msg") & " </b></span>")

            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No:" & FILE_NO.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Agent Name: " & lblagent.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date : " & Date.Now() & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Updated By : " & Session("FullNames") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------Notes--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & txtcomment.Text & "")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------End--------------------------------------------------------------------")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("<span style='font-size: 11pt; font-color:RED; font-family: Calibri'><b><i>THIS IS A SYSTEM GENERATED EMAIL.DO NOT REPLY!.</i></b>")
            'Membership Enquiry (membershipenquiry@aar.co.ke)
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("</table>")
            strHTML = strHTML.Append("</body>")
            strHTML = strHTML.Append("</html>")
            Dim mymail As New Emailing
            MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName, ccemail)
            Session("MailSent") = MailSent
        Catch ex As Exception
            'MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
            MailSent = False
        End Try

        Return MailSent
    End Function

    Protected Sub cboto_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboto.SelectedIndexChanged
        cbo_to_1.SelectedValue = ""
        lblemail.Text = ""
        If cboto.SelectedValue = "Admin" Then

            Str = "SELECT DISTINCT admin_name, email FROM [CRM].[dbo].[VW_MIS_CRM_SALES_ADMIN] WITH(NOLOCK)"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbo_to_1
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("admin_name").ToString
                .DataValueField = MyDatatable.Columns("email").ToString
                .DataBind()
            End With
        ElseIf cboto.SelectedValue = "BDM" Then
            '
            Str = "SELECT DISTINCT NAME,EMAIL FROM [COMMISSION].[dbo].[VW_SALES_MANAGERS]  WITH(NOLOCK) WHERE EMAIL<>''"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbo_to_1
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("NAME").ToString
                .DataValueField = MyDatatable.Columns("EMAIL").ToString
                .DataBind()

            End With
        End If
        lblemail.Text = cbo_to_1.SelectedValue
    End Sub

    Protected Sub cbo_to_1_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cbo_to_1.SelectedIndexChanged
        lblemail.Text = cbo_to_1.SelectedValue
    End Sub
End Class
