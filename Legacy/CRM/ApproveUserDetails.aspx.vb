Imports System.Data.SqlClient
Imports DocManage
Imports System.Web.Configuration
Imports QMailClient
Imports Mymail

Partial Class ApproveUserDetails
    Inherits System.Web.UI.Page
    Dim AuditTrailInsert As String = ""
    Public EnctryptionAlgorith As String = "rijndael"
    Dim SendMail As New Mail
    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

        If Not Page.IsPostBack Then
            Label4.Text = ""
            btnApprove.Enabled = False

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Page Access", "Accessed Admin users details approval page", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            ShowGridDetails()

            MultiView1.SetActiveView(View1)

            CmdApprovalList.BackColor = Drawing.Color.Olive
            CmdApprovalList.BorderStyle = BorderStyle.Inset
            CmdClientDetails.BackColor = Drawing.Color.Gray
            CmdClientDetails.BorderStyle = BorderStyle.Outset

        End If
    End Sub

    Private Sub ShowGridDetails()
        Dim MyDBAction As New DataManagement
        Dim SqlAction As String = ""
        Dim searchStr As String = ""
        Dim MyDatable As New Data.DataTable

        Session("ApproveEmployees") = Nothing

        Try
            SqlAction = "Select * from Employees where Approved = 0  order by EmployeeName  "
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDatable.Rows.Count > 0 Then
                Session("ApproveEmployees") = MyDatable

                GridView1.DataSource = Session("ApproveEmployees")
                GridView1.DataBind()

            Else
                GridView1.DataSource = MyDatable
                GridView1.DataBind()
            End If
        Catch ex As Exception

        End Try

    End Sub

    Protected Sub CmdApprovalList_Click(ByVal sender As Object, ByVal e As System.EventArgs)
        MultiView1.SetActiveView(View1)

        CmdApprovalList.BackColor = Drawing.Color.Olive
        CmdApprovalList.BorderStyle = BorderStyle.Inset
        CmdClientDetails.BackColor = Drawing.Color.Gray
        CmdClientDetails.BorderStyle = BorderStyle.Outset
    End Sub

    Protected Sub CmdClientDetails_Click(ByVal sender As Object, ByVal e As System.EventArgs)
        MultiView1.SetActiveView(View2)

        CmdClientDetails.BackColor = Drawing.Color.Olive
        CmdClientDetails.BorderStyle = BorderStyle.Inset
        CmdApprovalList.BackColor = Drawing.Color.Gray
        CmdApprovalList.BorderStyle = BorderStyle.Outset
        
    End Sub

    Protected Sub CmdSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdSave.Click
        SaveData()

    End Sub

    Private Sub SaveData()
        Dim SqlAction As String = ""
        Dim MySmsObject As New DataManagement
        Dim MyInitiator As String = ""
        Dim checkInitiator As New DataManagement
        Dim MailSent As Boolean = False
        Dim AuditAdditionalText As String = ""
        Dim Activated As Boolean = False
        Dim DateApproved As Date = Date.Now
        Dim DateApprovedStr As String = ""
        Label4.Text = ""
        btnApprove.Enabled = True

        Try
            If AuthorizedToApprove(HiddenField1.Value) = True Then

                DateApprovedStr = Format(DateApproved, "dd-MMM-yyyy")
                SqlAction = "UPDATE Employees set Approved = 1,APPROVEDBY ='" & Session("Fullnames") & "',DateApproved = '" & DateApprovedStr & "',Activated = '" & Activated & "' where EmployeeID =" & Session("MyEmployeeID1") & " "
                MySmsObject.DBAction(SqlAction, DataManagement.DBActionType.Update)

                Dim MyCredetials As String = SendMail.GetBeneficiary(Session("MyEmployeeID1"))

                'AUDIT TRAIL-------
                Dim audit As New DataManagement
                audit.AddAdminAuditTrail(Session("UserName").ToString, "Approve Employee Details", "Successfully Approved Employee details:- Employee Approved is: UserName - " & txtUserName.Text & ", Name - " & txtEmployeeName.Text & "." & AuditAdditionalText, _
                Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                '----END AUDIT TRAIL-----
                Dim MyIntro As String = ""
                MyIntro = ""
                MyIntro = MyIntro & SendMail.GetIntro("USER ID", "USERNAME", "USER NAMES")
                MyIntro = MyIntro & "<tr>"
                MyIntro = MyIntro & "<td>"
                MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Session("MyEmployeeID1") & "</u></b></span>"
                MyIntro = MyIntro & "</td>"
                MyIntro = MyIntro & "<td>"
                MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Session("UserName") & "</u></b></span>"
                MyIntro = MyIntro & "</td>"
                MyIntro = MyIntro & "<td>"
                MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Session("Fullnames") & "</u></b></span>"
                MyIntro = MyIntro & "</td>"
                MyIntro = MyIntro & "</tr>"
                MyIntro = MyIntro & "</table>"
                MyIntro = MyIntro & "<hr/>"
                MyIntro = MyIntro & "<p>"
                MyIntro = MyIntro & "<b>Your Details</b>"
                MyIntro = MyIntro & MyCredetials
                SendMail.Fin_Mail(Mail.FinMailType.User_Approval, MyIntro)

                Label4.Text = "User details successfully approved."
                ShowGridDetails()

                ''Dim MyControlAction As New DataCleanUp
                ''MyControlAction.ClearControls(MultiView1)

                btnApprove.Enabled = False

            Else
                Label4.Text = "You are not authorized to approve this record because you created/updated this record." : Exit Sub
            End If

        Catch ex As Exception

        End Try
    End Sub

    Private Function AuthorizedToApprove(ByVal ClientID As Integer) As Boolean

        Dim CanApprove As Boolean = False

        Try
            If Session("RecordStatus") = "New Record" Then
                If Session("AddedBy") = Session("FullNames") Then
                    'CanApprove = False
                    CanApprove = True

                Else
                    CanApprove = True
                End If

            ElseIf Session("RecordStatus") = "Update" Then
                If Session("ModifiedBy") = Session("FullNames") Then
                    'CanApprove = False
                    CanApprove = True
                Else
                    CanApprove = True
                End If
            End If
        Catch ex As Exception

        End Try

        Return CanApprove

    End Function

    Private Sub UpdateSMAccess(ByVal Updatestring As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(Updatestring, DataManagement.DBActionType.Update)
    End Sub

    Private Function RetrieveEmployeeDetails(ByVal MyEmployeeID As String) As Boolean
        Dim MailSent As Boolean = False

        Try
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim MySecurePass As New DocManagementSecurity
            Dim MyEmployeeName As String = ""
            Dim MyUserName As String = ""
            Dim MyPasswordEnc As String = ""
            Dim email As String = ""

            ''Dim MyRandPassword As String = MySecurePass.GenRandomPassword.ToLower
            ''Dim MyEncryptedPass As String = Cryptographer.Encrypt(MyRandPassword)

            Dim MyEmailAddress As String = ""
            Dim MyApprovaltext As String = ""

            Dim getemployeedetails As New DataManagement

            Dim MysqlAction As String = "Select EmployeeName,UserName,Password,Email from Employees WHERE EmployeeID = " & MyEmployeeID & ""
            Dim myreader As SqlDataReader = TryCast(getemployeedetails.DBAction(MysqlAction, DataManagement.DBActionType.DataReader), SqlDataReader)

            If myreader.HasRows Then
                myreader.Read()
                MyEmployeeName = IIf(IsDBNull(myreader("EmployeeName")) = True, "", myreader("EmployeeName").ToString.Trim)
                MyUserName = IIf(IsDBNull(myreader("UserName")) = True, "", myreader("UserName").ToString.Trim)
                MyPasswordEnc = IIf(IsDBNull(myreader("Password")) = True, "", myreader("Password").ToString.Trim)
                MyEmailAddress = IIf(IsDBNull(myreader("Email")) = True, "", myreader("Email").ToString.Trim)
            End If

            Dim MyPassword As String = Cryptographer.Decrypt(MyPasswordEnc)

            MailSent = SendLoginDetails(MyEmployeeName, MyUserName, MyPassword, MyEmailAddress)

        Catch ex As Exception

            MailSent = False

        End Try

        Return MailSent

    End Function

    Private Function SendLoginDetails(ByVal EmployeeName As String, ByVal UserName As String, ByVal Password As String, ByVal RecepientEmail As String) As Boolean

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

        ''--Below details have been removed from webconfig n r now retrieved from db - Mercy - 12th Apr 2011
        ''Dim strMailFromEmail As String = WebConfigurationManager.AppSettings("LoginFromEmail").ToString
        ''Dim strMailFromName As String = WebConfigurationManager.AppSettings("LoginDisplayName").ToString
        ''Dim MessageSubject As String = WebConfigurationManager.AppSettings("LoginSubject").ToString

        Try ''--Retrieve settings from db n decrypt - Mercy - 12th Apr 2011
            '  MySqlAction = "SELECT * FROM SystemSettings"
            '  MyDataTable = TryCast(MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            '  If MyDataTable.Rows.Count > 0 Then

            'LoginFromEmail = IIf(IsDBNull(MyDataTable.Rows(0).Item("LoginFromEmail")), "", MyDataTable.Rows(0).Item("LoginFromEmail"))
            'LoginDisplayName = IIf(IsDBNull(MyDataTable.Rows(0).Item("LoginDisplayName")), "", MyDataTable.Rows(0).Item("LoginDisplayName"))
            'LoginSubject = IIf(IsDBNull(MyDataTable.Rows(0).Item("LoginSubject")), "", MyDataTable.Rows(0).Item("LoginSubject"))
            'EmailServer = IIf(IsDBNull(MyDataTable.Rows(0).Item("EmailServer")), "", MyDataTable.Rows(0).Item("EmailServer"))
            'EmailUserName = IIf(IsDBNull(MyDataTable.Rows(0).Item("EmailUserName")), "", MyDataTable.Rows(0).Item("EmailUserName"))
            'EmailPassword = IIf(IsDBNull(MyDataTable.Rows(0).Item("EmailPassword")), "", MyDataTable.Rows(0).Item("EmailPassword"))
            LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail1").Trim()
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName1").Trim()
            LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject1").Trim()
            EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
            EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername1").Trim()
            EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword1").Trim()


            ''---Decrypt data
            'strMailFromEmail = MyEncryption.DecryptSHA(LoginFromEmail)
            'strMailFromName = MyEncryption.DecryptSHA(LoginDisplayName)
            'MessageSubject = MyEncryption.DecryptSHA(LoginSubject)
            'EmailServer = MyEncryption.DecryptSHA(EmailServer)
            'EmailUserName = MyEncryption.DecryptSHA(EmailUserName)
            'EmailPassword = MyEncryption.DecryptSHA(EmailPassword)

            ' Else
            'LoginFromEmail = ""
            'LoginDisplayName = ""
            'LoginSubject = ""
            'EmailServer = ""
            'EmailUserName = ""
            'EmailPassword = ""

            'End If

        Catch ex As Exception

        End Try


        Try

            Dim strHTML As New StringBuilder


            strHTML = strHTML.Append("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>")
            strHTML = strHTML.Append("<html xmlns='http://www.w3.org/1999/xhtml' >")
            strHTML = strHTML.Append("<head>")
            strHTML = strHTML.Append("</head>")
            strHTML = strHTML.Append("<body>")
            strHTML = strHTML.Append("<table style='width: 468px'>")
            strHTML = strHTML.Append("<tr>")
            strHTML = strHTML.Append("<td>")
            strHTML = strHTML.Append("</td>")
            strHTML = strHTML.Append("<td>")
            strHTML = strHTML.Append("</td>")
            strHTML = strHTML.Append("<td>")
            strHTML = strHTML.Append("</td>")
            strHTML = strHTML.Append("</tr>")
            strHTML = strHTML.Append("<tr>")
            strHTML = strHTML.Append("<td colspan='3'>")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>Dear " & EmployeeName & ",")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Below are your login details for MisReports This is a system randomly generated ")
            strHTML = strHTML.Append("password. Memorize the password then delete this email for security purposes. &nbsp;")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Your Username is: <em><span style='color: red'>")
            strHTML = strHTML.Append(" <strong>" & UserName & "</strong></span></em>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Your Password is: <em><span style='color: red'>")
            strHTML = strHTML.Append(" <strong>" & Password & "</strong></span></em>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("</table>")
            strHTML = strHTML.Append("</body>")
            strHTML = strHTML.Append("</html>")

            Dim myfinpaymail As New Emailing
            MailSent = myfinpaymail.SendNotification(MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName)

            Session("MailSent") = MailSent

        Catch ex As Exception
            MailSent = False
        End Try

        Return MailSent
    End Function

    Private Sub SendLoginNotification(ByVal strSignatoryName As String, ByVal strUserName As String, ByVal strPassword As String, ByVal strEmailAddress As String)
        Dim MyURL As String = ""
        Dim MyMailBody As New StringBuilder
        Dim MyMail As New EMail
        Dim mySMTPServer As New SMTPClient

        MyURL = WebConfigurationManager.AppSettings("InternetBankURL")

        MyMailBody.AppendLine()
        MyMailBody.Append("Dear " & strSignatoryName & ",")
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append("Here are your login details for MisReports System")
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append("   User Name:  " & strUserName)
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append("   Password:   " & strPassword)
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append("Access the site here:")
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append(MyURL)
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append("Incase of any query do not hesitate to call the System Admin")
        MyMailBody.AppendLine()
        MyMailBody.AppendLine()
        MyMailBody.Append("Kind Regards")


        MyMail.To = strEmailAddress
        MyMail.Subject = "Login details for Mis Reports "
        'MyMail.From = "Internet.Banking.Admin.Services"
        MyMail.Body = MyMailBody.ToString

        'mySMTPServer.RemoteServerAddress = "mailsvr2.bcr.local"
        'mySMTPServer.Connect()
        'mySMTPServer.SendMail(MyMail)

    End Sub
    Protected Sub CheckBox2_CheckedChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles CheckBox2.CheckedChanged
        If CheckBox2.Checked = True Then
            CheckBox2.Text = "De-Select All"
        Else
            CheckBox2.Text = "Select All"
        End If
    End Sub

    Protected Sub GridView1_RowCommand(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewCommandEventArgs) Handles GridView1.RowCommand
        Dim MyEmployeeID As Integer = Convert.ToInt32(e.CommandArgument)
        Dim sql As String

        HiddenField1.Value = MyEmployeeID

        Try

            Select Case e.CommandName
                Case "Select1"
                    sql = "Select * from Employees where EmployeeID = " & MyEmployeeID & ""

                    ShowEmployee(sql)
                    Session("MyEmployeeID1") = MyEmployeeID
                    ' ShowEmployee("Select * from Employees where EmployeeID= '" & HiddenField1.Value & "'")

                    MultiView1.SetActiveView(View2)
                    CmdApprovalList.BackColor = Drawing.Color.Gray
                    CmdApprovalList.BorderStyle = BorderStyle.Outset
                    CmdClientDetails.BackColor = Drawing.Color.Olive
                    CmdClientDetails.BorderStyle = BorderStyle.Inset
            End Select

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub

    Private Sub ShowEmployee(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        Session("EmailSent") = False
        Session("ModifiedBy") = ""
        Session("AddedBy") = ""
        Session("RecordStatus") = "New Record"
        Session("Activated") = False

        Label4.Text = ""
        btnApprove.Enabled = True

        Try
            Dim MyReader As SqlDataReader = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataReader), SqlDataReader)

            If MyReader.HasRows Then
                MyReader.Read()

                txtEmployeeName.Text = IIf(IsDBNull(MyReader("EmployeeName")) = True, "", MyReader("EmployeeName").ToString.Trim)
                txtTitle.Text = IIf(IsDBNull(MyReader("Title")) = True, "", MyReader("Title").ToString.Trim)
                'txtOfficeExt.Text = IIf(IsDBNull(MyReader("OfficeExtension")) = True, "", MyReader("OfficeExtension").ToString.Trim)
                txtCellPhone.Text = IIf(IsDBNull(MyReader("Cellphone")) = True, "", MyReader("Cellphone").ToString.Trim)
                txtEmail.Text = IIf(IsDBNull(MyReader("Email")) = True, "", MyReader("Email").ToString.Trim)
                txtOtherEmail.Text = IIf(IsDBNull(MyReader("OtherEmail")) = True, "", MyReader("OtherEmail").ToString.Trim)
                txtUserName.Text = IIf(IsDBNull(MyReader("UserName")) = True, "", MyReader("UserName").ToString.Trim)
                txtdepart.Text = IIf(IsDBNull(MyReader("Department")) = True, "", MyReader("Department").ToString.Trim)

                txtProfile.Text = IIf(IsDBNull(MyReader("PROFILEID")) = True, "", MyReader("PROFILEID").ToString.Trim) 'MyprofileName(MyReader("PROFILEID").ToString)

                chkUserLocked.Checked = IIf(IsDBNull(MyReader("Locked")), False, MyReader("Locked"))
                txtDaysToLockUser.Text = IIf(IsDBNull(MyReader("DaysTolockUser")) = True, "", MyReader("DaysTolockUser").ToString.Trim)

                If Val(MyReader("DaysTolockUser")) > 0 Then
                    chkAutomaticLock.Checked = True
                Else
                    chkAutomaticLock.Checked = False
                End If

                Session("RecordStatus") = IIf(IsDBNull(MyReader("RecordStatus")) = True, "New Record", MyReader("RecordStatus").ToString.Trim)
                Session("AddedBy") = IIf(IsDBNull(MyReader("ADDEDBY")) = True, "", MyReader("ADDEDBY").ToString.Trim)
                Session("ModifiedBy") = IIf(IsDBNull(MyReader("MODIFIEDBY")) = True, "", MyReader("MODIFIEDBY").ToString.Trim)
                ''Session("Deleted") = IIf(IsDBNull(MyReader("Deleted")) = True, False, MyReader("Deleted"))

                Session("EmailSent") = IIf(IsDBNull(MyReader("EmailSent")), False, MyReader("EmailSent"))
                Session("Activated") = IIf(IsDBNull(MyReader("Activated")), False, MyReader("Activated"))

                'AUDIT TRAIL-------
                Dim audit As New DataManagement
                audit.AddAdminAuditTrail(Session("UserName").ToString, "View Employee User (on Approve user page)", "Viewed Employee - username: " & txtUserName.Text.ToString, _
                Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                '----END AUDIT TRAIL-----
            End If

            MyReader.Close()

        Catch ex As Exception

        End Try
        
    End Sub

    Private Function MyprofileName(ByVal MyProfileID As String) As String
        Dim MySmsObject As New DataManagement
        Dim ProfileName As String = MySmsObject.DBAction("Select PROFILENAME from PROFILE where profileid=" & MyProfileID & " ", DataManagement.DBActionType.Scalar).ToString

        Return ProfileName

    End Function

    Private Sub AuditTrailLog(ByVal Updatestring As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(Updatestring, DataManagement.DBActionType.Insert)
    End Sub

    Protected Sub btnApprove_Click(ByVal sender As Object, ByVal e As System.EventArgs)
        SaveData()
    End Sub

    Protected Sub GridView1_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GridView1.SelectedIndexChanged

    End Sub
End Class
