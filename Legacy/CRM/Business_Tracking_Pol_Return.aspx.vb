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
                'Session("username") = "dkeronya"

                'Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where DOC_ID IN ('RET36') ORDER BY CODE"
                'MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                'With cbodoc
                '    .Items.Clear()
                '    .DataSource = MyDatatable
                '    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                '    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
                '    .DataBind()
                'End With


                'Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where DOC_ID IN ('RET30','RET36') ORDER BY CODE"
                'MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                'With cbodoc
                '    .Items.Clear()
                '    .DataSource = MyDatatable
                '    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                '    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
                '    .DataBind()
                'End With
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,WALK_IN_CLIENT,Allocate_Dt,Is_Branch   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE  Policy_Returned=1 AND Allocated_to='" & Session("username") & "' AND Is_Declined=0"
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
    Protected Sub GD_DOCS_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_DOCS.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("DOC_ID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""



            'DELETE FROM [TBL_MIS_CRM_DOCS] WHERE File_No=@File_No AND DOC_CODE=@DOC_ID
            UpdateRecord("UPDATE [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] SET Active=0  WHERE DOC_ID='" & HiddenField1.Value.ToString & "'")

            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Poilcy Doc Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".", _
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

             SqlAction = "SELECT  File_Name FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE File_No='" & FILE_NO.Text & "' AND Doc_Code='RET36' AND ACTIVE=1 AND Upload_Done=1"
            MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatatable.Rows.Count > 0 Then
                ' MyDBAction.TRACKING_ALLOCATION_UPDATE(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), "", txtcomment.Text, cboAction.SelectedValue, txtinv.Text, policy.Text)
            Else
                lblerr.Text = "You must upload the Policy Schedule Document!"
                Exit Sub
            End If
            'MyDBAction.TRACKING_ALLOCATION_UPDATE(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), "", txtcomment.Text, cboAction.SelectedValue, txtinv.Text, policy.Text)

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

            If cboAction.SelectedValue = "S" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET   [Policy_Signed]=0,   Policy_Generated=1 , Policy_Returned=0,Policy_Approved=0 , Policy_Verified=0 , File_Status='POLICY-SIGNING' where [File_No]='" & FILE_NO.Text & "'")
                'Session("to") = lblRM.Text

                Session("msg") = "Kindly note that the Policy Schedule for above  business has been updated  and forwarded to Signing"
            ElseIf cboAction.SelectedValue = "R" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Policy_Generated=1 , Policy_Returned=0,Policy_Approved=0 , Policy_Verified=0 , File_Status='POLICY GENERATED' where [File_No]='" & FILE_NO.Text & "'")
                Session("to") = lblRM.Text
                Session("msg") = "Kindly note that the Policy Schedule for above  business has been updated.You are required to verify the Policy Schedule on the Policy Verification link"

            ElseIf cboAction.SelectedValue = "IT" Then
                Session("email") = "IThelpdesk@aar.co.ke"
                Session("msg") = "Kindly note that the above business has IT issue and has been forwarded to IT Service Desk "

            End If

            'Session("email") = "jmwaniki@aar.co.ke"
            MailSent = SendLoginDetails(lblenteredby.Text, Session("email"), Session("email_cc"))

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
            Dim agent As String = ""
            HiddenField1.Value = 1
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [Agent_Id],[File_No],entered_By,Allocated_to,eOx_Invoice_No,Policy_Code,Client_Type,Proposer_Name   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                policy.Text = MyDatable.Rows(0).Item("Policy_Code").ToString()
                lblclient.Text = MyDatable.Rows(0).Item("Client_Type").ToString()
                lblprop.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                agent = MyDatable.Rows(0).Item("Agent_Id").ToString()
                loadGrid(FILE_NO.Text)

                Str = "SELECT AGENT_NAME,RE_NAME FROM  [dbo].[VW_MIS_CRM_RM_AGENT_MAP_CORP] WHERE USER_ID='" & agent & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    lblRM.Text = MyDatatable.Rows(0).Item("RE_NAME").ToString()
                    lblagent.Text = MyDatatable.Rows(0).Item("AGENT_NAME").ToString()
                End If

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                Else
                    Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" & lblenteredby.Text & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                    Else
                        Session("email_CC") = "relationship-managers@aar.co.ke"
                    End If

                End If
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try

            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=1 AND Policy_Returned=1 AND  Is_Declined=0"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=1 AND Policy_Returned=1 AND Is_Declined=0"
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear:" & lblenteredby.Text & " </u></b> </span>")
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
    Protected Sub GDTracking_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTracking.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("WALK_IN_CLIENT")
            If myCell.Text = "Y" Then
                dataItem.BackColor = Drawing.Color.Green
            End If

            myCell = dataItem("Is_Branch")
            If myCell.Text = 1 Then
                dataItem.BackColor = Drawing.Color.CadetBlue
                'dataItem.ForeColor = Drawing.Color.Red
            End If
        End If
    End Sub
    Protected Sub btnupload_1_Click(sender As Object, e As System.EventArgs) Handles btnupload_1.Click

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

            If FL2.PostedFile.FileName = "" Then
                lblerr.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If
            If txttitle.Text = "" Then
                lblerr.Text = "You must Select Document title!"
                Exit Sub
            End If

            Dim filePath As String = FL2.PostedFile.FileName
            Dim filename As String = Path.GetFileName(filePath)
            Dim ext As String = Path.GetExtension(filename)
            Dim contenttype As String = String.Empty
            Dim fs As Stream = FL2.PostedFile.InputStream
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
                MyDBAction.UPLOAD_File_DOCS(bytes, filename, contenttype, FILE_NO.Text, Trim(txttitle.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), HiddenField1.Value)
                'Response.Redirect(Request.Url.AbsoluteUri)


                LBLUPLOAD.ForeColor = System.Drawing.Color.Green

                LBLUPLOAD.Text = "File Uploaded Successfully"

            Else
                LBLUPLOAD.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If
            loadGrid(FILE_NO.Text)



        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Protected Sub GD_DOCS_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_DOCS.SelectedIndexChanged
        Try
            Dim stst As String = ""
            HiddenField1.Value = ""
            'ltEmbed.Text = ""
            stst = (DirectCast(GD_DOCS.SelectedItems(0), GridDataItem)).GetDataKeyValue("DOC_ID").ToString()
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM  [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  DOC_ID ='" & stst & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                HiddenField1.Value = MyDatable.Rows(0).Item("DOC_ID").ToString()
                txttitle.Text = MyDatable.Rows(0).Item("Doc_Title").ToString()
            End If
            'ltEmbed.Text = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
End Class
