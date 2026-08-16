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
                ltEmbed.Text = ""
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                Session("Allocated") = Nothing
                Session("Medical_UW") = Nothing
                'Session("username") = "kmunyeki"
                Str = "SELECT  [DOC_CODE],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where DOC_CODE IN ('RET17,'RET18')"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbodoc
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                    .DataValueField = MyDatatable.Columns("DOC_CODE").ToString
                    .DataBind()
                End With
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1 AND Client_Type IN ('C','S') AND ALLOCATED=1 AND Benefit_Verified='NO' AND Is_Declined=0 AND Business='M'  AND Is_Active=1"
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

            SqlAction = "SELECT [DOC_ID] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & FILE_NO.Text & "' AND ACTIVE=1" ' AND Doc_code='RET33'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                If cboAction.SelectedValue = "YES" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET File_Status='ALLOCATED',Allocate_Dt='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  [Benefit_verified]='" & cboAction.SelectedValue & "', [Benefit_ver_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "', [Benefit_Ver_by]='" & Session("username") & "'  where [File_No]='" & FILE_NO.Text & "'")
                Else
                    MyDBAction.TRACKING_ALLOCATION_MSHIP(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, "RI", "")
                End If

                If txtcomment.Text <> "" Then
                    MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
                End If

                If cboAction.SelectedValue = "YES" Then
                    Session("To") = lblallocated.Text
                    Session("msg") = "Kindly note that benefits for the above client have been verified and approved.Proceed to update"
                    MailSent = SendLoginDetails(lblallocated.Text, Session("email"), Session("email_cc"))

                ElseIf cboAction.SelectedValue = "NO" Then
                    Session("To") = lblenteredby.Text
                    Session("msg") = "Kindly note that benefits for the above client have been Rejected.See below comments for your action."
                    MailSent = SendLoginDetails(lblenteredby.Text, Session("email_cc"), Session("email_cc"))
                End If
                'Session("email") = "jmwaniki@aar.co.ke"

                lblerr.Text = "Business updated successfully!"
                loadGrid_N()
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
                GDNOTES.DataSource = Nothing
                GDNOTES.DataBind()
            Else
                lblerr.Text = "YOU MUST UPLOAD THE APPROVED RATES MATRIX!"
                'lblupload.Focus()
                'lblupload.BackColor = Drawing.Color.Red
                Exit Sub
            End If





            ltEmbed.Text = ""
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
            Dim allocated As String = ""
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],entered_By,Allocated_to,eOx_Invoice_No,Allocated,Medical_UW   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                [lblallocated].Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                Session("Allocated") = MyDatable.Rows(0).Item("Allocated").ToString()
                Session("Medical_UW") = MyDatable.Rows(0).Item("Medical_UW").ToString()
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
            End If

            Str = "SELECT EMAIL FROM employees WHERE username='" & [lblallocated].Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                End If


        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try

            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Str & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND Benefit_verified=0   AND  Is_Declined=0 and Business='M'  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Str & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND Benefit_verified=0 AND Is_Declined=0  and Business='M'  AND Is_Active=1"
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Dear : </b>" & Session("To") & "  </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = "Quatation Verification :" & FILE_NO.Text & ""
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>" & Session("msg") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No    :</b>" & FILE_NO.Text & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date       :</b> " & Date.Now() & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Updated By :</b> " & Session("FullNames") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------<b>Notes</b>--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & txtcomment.Text & "")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------End----------------------------------------------------------")
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
    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click
        Dim MyDatable As New Data.DataTable
        Dim STS As Integer
        Dim aar As Integer = 0
        Dim PROPOSER_ID As String
        Dim PERIOD As String
        Dim FILENO As String
        'ltEmbed.Text = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "You must Select The file!"
                Exit Sub
            End If

            If FL1.PostedFile.FileName = "" Then
                lblerr.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If
            If cbodoc.Text = "" Then
                lblerr.Text = "You must Select Document title!"
                Exit Sub
            End If

            Dim filePath As String = FL1.PostedFile.FileName
            Dim filename As String = Path.GetFileName(filePath)
            Dim ext As String = Path.GetExtension(filename)
            Dim contenttype As String = String.Empty
            Dim fs As Stream = FL1.PostedFile.InputStream
            Dim br As New BinaryReader(fs)
            Dim bytes As Byte() = br.ReadBytes(DirectCast(fs.Length, Long))

            Dim app As Integer = 0

            Select Case ext
                Case ".doc"
                    contenttype = "application/vnd.ms-word"
                    Exit Select
                Case ".docx"
                    contenttype = "application/vnd.ms-word"
                    Exit Select
                Case ".xls"
                    contenttype = "application/vnd.ms-excel"
                    Exit Select
                Case ".xlsx"
                    contenttype = "application/vnd.ms-excel"
                    Exit Select
                Case ".jpg"
                    contenttype = "image/jpg"
                    Exit Select
                Case ".png"
                    contenttype = "image/png"
                    Exit Select
                Case ".gif"
                    contenttype = "image/gif"
                    Exit Select
                Case ".pdf"
                    contenttype = "application/pdf"
                    Exit Select
                Case ".rar"
                    contenttype = "application/zip"
                    Exit Select
                Case ".zip"
                    contenttype = "application/zip"
                    Exit Select
            End Select

            If contenttype <> String.Empty Then
                Dim fileLocation As String = ""
                MyDBAction.UPLOAD_File_DOC_INVOIC(bytes, filename, contenttype, FILE_NO.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, "")
                'Response.Redirect(Request.Url.AbsoluteUri)
                lblupload.ForeColor = System.Drawing.Color.Green

                lblupload.Text = "File Uploaded Successfully"

            Else
                lblupload.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If
            loadGrid(FILE_NO.Text)
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub GD_DOCS_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_DOCS.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("DOC_ID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""
            Dim audit As New DataManagement
            'UpdateRecord("UPDATE  [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Is_Active=0  WHERE File_No='" & HiddenField1.Value.ToString & "'")
            'DeleteRecord("DELETE FROM TBL_MIS_CRM_DOCS WHERE  File_No='" & HiddenField1.Value.ToString & "'")

            DeleteRecord("DELETE FROM   [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS]  WHERE DOC_ID='" & HiddenField1.Value.ToString & "' and UPload_by='" & Session("username") & "'")

            audit.AddAdminAuditTrail(Session("UserName").ToString, "Document Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)

            loadGrid(HiddenField1.Value)

            HiddenField1.Value = ""
            HiddenField1.Value = ""

            'ResetDisplayed("NewRecord")
            lblerr.Text = "Record Deleted!"
            'CmdSave.Enabled = False



        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub



End Class
