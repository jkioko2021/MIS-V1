Imports DocManage
Imports System.Data.SqlClient
Imports Mymail
Imports System.Web.Configuration
Imports Telerik.Web.UI

Partial Class UserDetails
    Inherits System.Web.UI.Page
    Public EnctryptionAlgorith As String = "rijndael"
    Dim SendMail As New Mail
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""
    Dim Str As String

    Protected Sub CmdClientRegistration_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdClientRegistration.Click
        MultiView1.SetActiveView(View1)

        CmdClientRegistration.BackColor = Drawing.Color.Olive
        CmdClientRegistration.BorderStyle = BorderStyle.Inset
        CmdClientSearch.BackColor = Drawing.Color.Gray
        CmdClientSearch.BorderStyle = BorderStyle.Outset
    End Sub

    Protected Sub CmdClientSearch_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdClientSearch.Click
        MultiView1.SetActiveView(View2)

        CmdClientSearch.BackColor = Drawing.Color.Olive
        CmdClientSearch.BorderStyle = BorderStyle.Inset
        CmdClientRegistration.BackColor = Drawing.Color.Gray
        CmdClientRegistration.BorderStyle = BorderStyle.Outset

    End Sub

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        ''ShowGridDetails("ShowAll")

        If Not Page.IsPostBack Then
            MultiView1.SetActiveView(View1)
            txtDaysToLockUser.Text = 0
            Label5.Visible = False
            CheckBox2.Visible = False
            Label7.Visible = False

            CmdClientRegistration.BackColor = Drawing.Color.Olive
            CmdClientRegistration.BorderStyle = BorderStyle.Inset
            CmdClientSearch.BackColor = Drawing.Color.Gray
            CmdClientSearch.BorderStyle = BorderStyle.Outset

            ShowProfiles()
            'ShowGridDetails()
            ''AUDIT TRAIL-------
            'Dim audit As New DataManagement
            'audit.AddAdminAuditTrail(Session("UserName").ToString, "Page Access", "Accessed page for Adding employee users", _
            'Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            ''----END AUDIT TRAIL-----
        End If
        LblErr.Text=""
        Panel3.Visible = False
    End Sub

    Protected Sub CmdSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdSave.Click
        If Page.IsValid = False Then Exit Sub
        Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
        Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

        Dim MySqlAction As String = ""
        Dim MyDBAction As New DataManagement
        Dim MyDataTable As New Data.DataTable
        Dim empcode As String = ""
        Dim ProfileName As String = ""


        Dim MySecurePass As New DocManagementSecurity
        Dim strMyPassword As String = ""
        Dim activated As Boolean = "0"

        Dim EmailSent As Boolean = False

        Dim UserLocked As Int16 = chkUserLocked.Checked

        If txtDaysToLockUser.Text = "" Then
            txtDaysToLockUser.Text = 0
        End If





        If HiddenField1.Value.ToString = "" Then


        'If ProfileName <> "SuperAdmin" Then LblErr.Text = "You are not authorized to assign the selected profile to this user." : Panel3.Visible = True : Exit Sub

        Session("RecordStatus") = ""
        Session("RecordStatus") = "New Record"

        If UserNameExist(txtUserName.Text.Trim) Then LblErr.Text = "The user Name exists.Use a different username" : Panel3.Visible = True : Exit Sub
        'strMyPassword = MySecurePass.EncryptedPass(GenRandomPassword)
        'strMyPassword = MySecurePass.EncryptedPass(MySecurePass.GenRandomPassword)
        'txtPassword.Text = MySecurePass.GenRandomPassword
        txtPassword.Text = "password"
        strMyPassword = Cryptographer.Encrypt(txtPassword.Text)



        HiddenField1.Value = MyDBAction.AddEmployees(cboprofile.SelectedValue.ToString.Trim, Session("FullNames"), _
        txtEmployeeName.Text.Trim, txtTitle.Text.Trim, txtOfficeExt.Text.Trim, txtCellPhone.Text.Trim, _
        txtEmail.Text.Trim, txtUserName.Text.Trim, txtOtherEmail.Text.Trim, txtDaysToLockUser.Text.Trim, UserLocked, _
        strMyPassword, activated, cbodepart.SelectedValue, Session("RecordStatus"))

        ' MyDBAction.AddStaticDataMaintenanceReason(HiddenField1.Value, "Employee Registration", "New Employee registration", "Employee")

        LblErr.Text = "Record Saved Successfully. Approval Required."
        Panel3.Visible = True
        'AUDIT TRAIL-------
        Dim audit As New DataManagement
        audit.AddAdminAuditTrail(Session("UserName").ToString, "Add Employee User", "Employee added successfully: " & txtUserName.Text.Trim & _
        " Profile:" & cboprofile.SelectedValue.ToString.Trim & ".", _
        Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
        '----END AUDIT TRAIL-----

        Dim MyIntro As String = ""
        MyIntro = SendMail.GetIntro("USER ID", "USERNAME", "PassWord")
        MyIntro = MyIntro & "<tr>"
        MyIntro = MyIntro & "<td>"
        MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & HiddenField1.Value & "</u></b></span>"
        MyIntro = MyIntro & "</td>"
        MyIntro = MyIntro & "<td>"
        MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & txtUserName.Text.Trim & "</u></b></span>"
        MyIntro = MyIntro & "</td>"
        MyIntro = MyIntro & "<td>"
        MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & txtPassword.Text.Trim & "</u></b></span>"
        MyIntro = MyIntro & "</td>"
        MyIntro = MyIntro & "</tr>"

        MyIntro = MyIntro & "<tr>"
        MyIntro = MyIntro & "<td colspan='3'><span>Welcome " & txtEmployeeName.Text.Trim & " to  ( reporting system). Kindly use the credentials shown above to log after you have received a confirmation that this account is active. The system will prompt you to change the password the first time you log in.</span>"
        MyIntro = MyIntro & "</td>"
        MyIntro = MyIntro & "</tr>"

        MyIntro = MyIntro & "</table>"
        SendMail.Fin_Mail(Mail.FinMailType.New_User, MyIntro)

        Else
            'If ProfileName <> "SUPER ADMIN" And Session("CurrentProfile") <> cboprofile.SelectedItem.Text Then LblErr.Text = "You are not authorized to assign the selected profile to this user." : Panel3.Visible = True : Exit Sub

        Session("RecordStatus") = ""
        Session("RecordStatus") = "Update"

        Dim approvedBy As String = ""
        Dim approved As Boolean = False

        If Session("AccountLocked") = True Then
            If chkUserLocked.Checked = False Then
                strMyPassword = MySecurePass.GenRandomPassword.ToLower
                txtPassword.Text = strMyPassword
                strMyPassword = Cryptographer.Encrypt(strMyPassword)

                EmailSent = False
            Else
                strMyPassword = txtPassword.Text.Trim
                EmailSent = Session("EmailSent")
            End If

        Else
            strMyPassword = txtPassword.Text.Trim
            EmailSent = Session("EmailSent")
        End If

        MyDBAction.UpdateEmployees(HiddenField1.Value.ToString, approvedBy, approved, _
        cboprofile.SelectedValue.ToString.Trim, txtEmployeeName.Text.Trim, txtTitle.Text.Trim, txtOfficeExt.Text.Trim, _
        "", txtCellPhone.Text.Trim, txtEmail.Text.Trim, txtUserName.Text.Trim, strMyPassword, txtOtherEmail.Text.Trim, _
        txtDaysToLockUser.Text.Trim, UserLocked, Session("FullNames"), cbodepart.SelectedValue, Session("RecordStatus"), EmailSent)

        LblErr.Text = "Record Updated Successfully. Approval Required."
        Panel3.Visible = True

        'AUDIT TRAIL-------
        Dim audit As New DataManagement
        audit.AddAdminAuditTrail(Session("UserName").ToString, "Update Employee User", "Updated Employee user: " & txtUserName.Text.Trim & _
        " Profile:" & cboprofile.SelectedValue.ToString.Trim & ".", _
        Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
        '----END AUDIT TRAIL-----
        End If

        'ShowGridDetails()
    End Sub

    Private Function RetrieveProfileName(ByVal ProfileID As Integer) As String
        Dim MySqlAction As String = ""
        Dim MyDBAction As New DataManagement
        Dim MyDataTable As New Data.DataTable
        Dim ProfileName As String = ""

        Try
            MySqlAction = "SELECT ProfileName FROM Profile WHERE ProfileID = " & ProfileID & ""
            MyDataTable = TryCast(MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDataTable.Rows.Count > 0 Then
                ProfileName = MyDataTable.Rows(0).Item("ProfileName")

            Else
                ProfileName = ""
            End If

        Catch ex As Exception
            ProfileName = ""
        End Try

        Return ProfileName
    End Function

    Protected Sub LinkButton1_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles LinkButton1.Click
        ResetDisplayed("NewRecord")

        Label7.Visible = False
        CheckBox2.Visible = False
        CmdSave.Enabled = True
    End Sub

    Protected Sub Cancel_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles Cancel.Click
        ResetDisplayed("CancelRecord")
    End Sub

    Private Sub ResetDisplayed(ByVal strResetType As String)

        txtUserName.Enabled = True

        Select Case strResetType
            Case "NewRecord"
                txtEmployeeName.Text = ""
                txtTitle.Text = ""
                txtOfficeExt.Text = ""
                txtCellPhone.Text = ""
                txtEmail.Text = ""
                txtOtherEmail.Text = ""
                txtUserName.Text = ""
                cboprofile.Text = ""
                cbodepart.Text = ""
                chkUserLocked.Checked = False
                chkAutomaticLock.Checked = False
                HiddenField1.Value = ""
                txtDaysToLockUser.Text = "0"
                txtPassword.Text = ""


            Case "CancelRecord"
                If HiddenField1.Value <> "" Then
                    ShowEmployee("Select * from PROFILE where PROFILEID= " & HiddenField1.Value.ToString & "")
                Else
                    txtEmployeeName.Text = ""
                    txtTitle.Text = ""
                    txtOfficeExt.Text = ""
                    txtCellPhone.Text = ""
                    txtEmail.Text = ""
                    txtOtherEmail.Text = ""
                    txtUserName.Text = ""
                    cboprofile.SelectedValue = ""
                    chkUserLocked.Checked = False
                    chkAutomaticLock.Checked = False
                    HiddenField1.Value = ""
                    txtDaysToLockUser.Text = "0"
                    txtPassword.Text = ""
                End If
        End Select
    End Sub



    ''Protected Sub GridView1_PageIndexChanging(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewPageEventArgs) Handles GridView1.PageIndexChanging
    ''    GridView1.DataSource = Session("Employees")
    ''    GridView1.PageIndex = e.NewPageIndex
    ''    GridView1.DataBind()
    ''End Sub

    Private Sub updateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

        'ShowGridDetails()
    End Sub

    Private Sub ShowEmployee(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        Session("Approved") = False
        Session("AddedBy") = ""
        Session("ModifiedBy") = ""
        Session("RecordStatus") = ""
        Session("AccountLocked") = False
        Session("EmailSent") = False
        Session("CurrentProfile") = ""
        txtUserName.Enabled = False

        Try
            Dim MyReader As SqlDataReader = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataReader), SqlDataReader)

            If MyReader.HasRows Then
                MyReader.Read()

                txtEmployeeName.Text = MyReader("EmployeeName")
                txtTitle.Text = IIf(IsDBNull(MyReader("Title")), "", MyReader("Title")) 'MyReader("Title")
                'txtOfficeExt.Text = MyReader("OfficeExtension")
                txtCellPhone.Text = MyReader("Cellphone")
                txtEmail.Text = IIf(IsDBNull(MyReader("Email")), "", MyReader("Email")) 'MyReader("Email")
                txtOtherEmail.Text = IIf(IsDBNull(MyReader("Email")), "", MyReader("Email"))
                txtUserName.Text = MyReader("UserName")
                cboprofile.SelectedValue = IIf(IsDBNull(MyReader("ProfileID")), "", MyReader("ProfileID")) ' MyReader("ProfileID")
                Session("CurrentProfile") = cboprofile.SelectedItem.Text
                txtPassword.Text = MyReader("Password")
                cboprofile.SelectedValue = IIf(IsDBNull(MyReader("Department")), "", MyReader("Department")) ' MyReader("Department")

                Session("AddedBy") = IIf(IsDBNull(MyReader("AddedBy")), "", MyReader("AddedBy"))
                Session("ModifiedBy") = IIf(IsDBNull(MyReader("ModifiedBy")), "", MyReader("ModifiedBy"))
                Session("RecordStatus") = IIf(IsDBNull(MyReader("RecordStatus")), "New Record", MyReader("RecordStatus"))
                Session("Approved") = IIf(IsDBNull(MyReader("Approved")), False, MyReader("Approved"))

                Session("EmailSent") = IIf(IsDBNull(MyReader("EmailSent")), False, MyReader("EmailSent"))

                If Session("Approved") = False Then
                    Label7.Visible = False
                    CheckBox2.Visible = False

                Else
                    Label7.Visible = True
                    CheckBox2.Visible = True
                End If

                chkUserLocked2.Checked = IIf(IsDBNull(MyReader("EmployeeLocked")), False, CBool(MyReader("EmployeeLocked")))

                If chkUserLocked2.Checked = True Then
                    Session("AccountLocked") = True

                    Label7.Visible = False
                    CheckBox2.Visible = False

                Else
                    Session("AccountLocked") = False

                    If Session("Approved") = False Then
                        Label7.Visible = False
                        CheckBox2.Visible = False

                    Else
                        Label7.Visible = True
                        CheckBox2.Visible = True
                    End If
                End If


                txtDaysToLockUser.Text = MyReader("DaysTolockUser")
                If Val(MyReader("DaysTolockUser")) > 0 Then
                    chkAutomaticLock.Checked = True
                Else
                    chkAutomaticLock.Checked = False
                End If

            End If
            MyReader.Close()

        Catch ex As Exception

        End Try
    End Sub

    Private Sub ShowProfiles()
        Try
            Dim MyDataTable As New Data.DataTable
            Dim MyDBAction As New DataManagement
            MyDataTable = TryCast(MyDBAction.DBAction("Select PROFILEID,PROFILENAME FROM PROFILE WHERE PROFILETYPE = 'ADMIN'", DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDataTable IsNot Nothing Then
                With cboprofile
                    .Items.Clear()
                    .DataSource = MyDataTable
                    .DataTextField = MyDataTable.Columns("PROFILENAME").ToString
                    .DataValueField = MyDataTable.Columns("PROFILEID").ToString
                    .DataBind()

                    Dim MyItem As New RadComboBoxItem
                    MyItem.Text = ""
                    MyItem.Value = ""
                    .Items.Add(MyItem)
                    .SelectedValue = MyItem.Value
                End With
                MyDataTable = Nothing
            End If

        Catch ex As Exception

        End Try
    End Sub

    Private Function GenRandomPassword() As String
        Dim KeyGen As RandomKeyGenerator
        Dim NumKeys As Integer
        'Dim i_Keys As Integer
        Dim RandomKey As String

        ' MODIFY THIS TO GET MORE KEYS    - LAITH - 27/07/2005 22:48:30 -
        NumKeys = 1

        KeyGen = New RandomKeyGenerator
        KeyGen.KeyLetters = "abcdefghijklmnopqrstuvwxyz"
        KeyGen.KeyNumbers = "0123456789"
        KeyGen.KeyChars = 5

        RandomKey = KeyGen.Generate()

        Return RandomKey

        'For i_Keys = 1 To NumKeys
        '    RandomKey = KeyGen.Generate()
        '    Console.WriteLine(RandomKey)
        'Next
        'Console.WriteLine("Press any key to exit...")
        'Console.Read()
    End Function
    Private Function UserNameExist(ByVal strUserName As String) As Boolean
        Dim MyDBAction As New DataManagement
        Dim MyTable As Data.DataTable

        Dim MySqlAction As String = "Select USERNAME from Employees where USERNAME = '" & strUserName & "'"

        MyTable = TryCast(MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyTable.Rows.Count > 0 Then
            Return True
        Else
            Return False
        End If

    End Function

  

    Protected Sub CheckBox2_CheckedChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles CheckBox2.CheckedChanged
        ''btnSendEmail.Enabled = True

        If CheckBox2.Checked = True Then
            If Session("Approved") = True Then
                btnSendEmail.Enabled = True
                btnSendEmail.Visible = True
                txtPass.Visible = True
                Label3.Visible = True
                Label5.Visible = True
                txtPass.Enabled = True
                CmdSave.Enabled = False
                Cancel.Enabled = False


            Else
                btnSendEmail.Visible = False
                btnSendEmail.Enabled = False
                txtPass.Visible = False
                Label3.Visible = False
                Label5.Visible = False
                CmdSave.Enabled = True
                Cancel.Enabled = True
                LblErr.Text = "Approval required before password can be reset."
                Panel3.Visible = True
            End If
        Else
            btnSendEmail.Visible = False
            btnSendEmail.Enabled = False
            txtPass.Visible = False
            Label3.Visible = False
            Label5.Visible = False
            CmdSave.Enabled = True
            Cancel.Enabled = True
        End If
    End Sub

    Private Function AuthorizedToApprove(ByVal ClientID As Integer) As Boolean

        Dim CanApprove As Boolean = False

        Try
            If Session("RecordStatus") = "New Record" Then
                If Session("AddedBy") = Session("FullNames") Then
                    CanApprove = False

                Else
                    CanApprove = True
                End If

            ElseIf Session("RecordStatus") = "Update" Then
                If Session("ModifiedBy") = Session("FullNames") Then
                    CanApprove = False

                Else
                    CanApprove = True
                End If
            End If
        Catch ex As Exception

        End Try

        Return CanApprove

    End Function

    Protected Sub btnSendEmail_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnSendEmail.Click

        Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
        Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
        Dim MySecurePass As New DocManagementSecurity
        Dim MyPasswordEnc As String = ""
        Dim MyRandPassword As String = MySecurePass.GenRandomPassword.ToLower
        Dim MyEncryptedPass As String = Cryptographer.Encrypt(MyRandPassword)
        Dim my_sql As String = ""

        Dim beforeEnc As String = txtPass.Text
        Dim MyEncPass As String = Cryptographer.Encrypt(beforeEnc)
        Dim mydecrypw As String = ""
        Dim my_object As New DataManagement
        Dim MailSent As Boolean = False
        Dim approved As Boolean = False

        Session("EmpEmail") = ""
        Session("EmpUsername") = ""
        Session("EmployeeName") = ""
        Session("empPass") = ""

        Try

            ''If AuthorizedToApprove(HiddenField1.Value) = True Then
            '==============checking credentials of user trying to resend password=============================================
            my_sql = "select password from employees where employeeID = '" & Session("MyEmployeeID") & "' and password = '" & MyEncPass & "' "
            Dim my_reader As SqlDataReader = TryCast(my_object.DBAction(my_sql, DataManagement.DBActionType.DataReader), SqlDataReader)

            If my_reader.HasRows Then
                my_reader.Read()
                Label5.Visible = True
            Else
                LblErr.Text = "Wrong Password"
                Panel3.Visible = True
                Exit Sub
            End If

            '==========fetching details of employee to be sent for password =============================================
            my_sql = "select EmployeeName,Approved,Email,UserName from employees where employeeID = '" & HiddenField1.Value & "' "
            my_reader = my_object.DBAction(my_sql, DataManagement.DBActionType.DataReader)

            If my_reader.HasRows Then
                my_reader.Read()
                approved = IIf(IsDBNull(my_reader("Approved")), False, my_reader("Approved"))
                Session("EmpEmail") = IIf(IsDBNull(my_reader("Email")) = True, "", my_reader("Email").ToString.Trim)
                Session("EmpUsername") = IIf(IsDBNull(my_reader("UserName")) = True, "", my_reader("UserName").ToString.Trim)
                Session("EmployeeName") = IIf(IsDBNull(my_reader("EmployeeName")) = True, "", my_reader("EmployeeName").ToString.Trim)

                my_sql = "update employees set password = '" & MyEncryptedPass & "', Activated = 0,EMPLOYEELOCKED=0 where employeeID = '" & HiddenField1.Value & "'"
                my_object.DBAction(my_sql, DataManagement.DBActionType.Update)

                ''Session("empPass") = Cryptographer.Decrypt(MyEncryptedPass) --Unnecessary step since we already have the decrypted pwd.
                Session("empPass") = MyRandPassword

            End If

            If approved = False Then
                LblErr.Text = "User requires approval"
                Panel3.Visible = True
                Exit Sub
            Else
                If Session("EmpEmail") <> "" Then
                    MailSent = SendLoginDetails()

                    If MailSent = True Then
                        LblErr.Text = "A Random Password has been generated and sent to the user's Email Address."
                        Panel3.Visible = True
                        'AUDIT TRAIL-------
                        Dim audit As New DataManagement
                        audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "Password for user " & txtEmployeeName.Text.Trim & " successfully emailed to: " & txtEmail.Text.Trim & ".", _
                        Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                        '----END AUDIT TRAIL-----

                    Else
                        LblErr.Text = "Failure sending mail. Contact the system administrator."
                        Panel3.Visible = True
                        'AUDIT TRAIL-------
                        Dim audit As New DataManagement
                        audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "There a was a problem resending password for user " & txtEmployeeName.Text.Trim & " to: " & txtEmail.Text.Trim & ".", _
                        Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                        '----END AUDIT TRAIL-----
                    End If

                ElseIf Session("EmpEmail") = "" Then

                    LblErr.Text = "No email address found in the user's records."
                    Panel3.Visible = True
                    'AUDIT TRAIL-------
                    Dim audit As New DataManagement
                    audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "There a was a problem resending password for user " & txtEmployeeName.Text.Trim & " to: " & txtEmail.Text.Trim & " - No valid email address found on user's records.", _
                    Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                    '----END AUDIT TRAIL-----
                Else

                    LblErr.Text = "A problem occured while sending the E-mail."
                    Panel3.Visible = True
                    'AUDIT TRAIL-------
                    Dim audit As New DataManagement
                    audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "There a was a problem resending password for user " & txtEmployeeName.Text.Trim & " to: " & txtEmail.Text.Trim & ".", _
                    Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                    '----END AUDIT TRAIL-----
                End If
            End If

            ''Else
            ''Label4.Text = "Failure resetting password: Creator/Modifier cannot resend password."
            ''End If

        Catch ex As Exception

        End Try
        ' End If
    End Sub

    Private Function SendLoginDetails() As Boolean

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


        Try

            LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail1").Trim()
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName1").Trim()
            LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject1").Trim()
            EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
            EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername1").Trim()
            EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword1").Trim()
            MessageSubject = "MIS Password Reset" ' System.Configuration.ConfigurationManager.AppSettings("Subject").Trim()



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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>Dear " & Session("EmployeeName").ToString & ",")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Below are your login details for MISReports System. This is a system randomly generated ")
            strHTML = strHTML.Append("password. &nbsp;")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Your Username is: <em><span style='color: red'>")
            strHTML = strHTML.Append(" <strong>" & Session("EmpUsername") & "</strong></span></em>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Your password is: <em><span style='color: red'>")
            strHTML = strHTML.Append(" <strong>" & Session("empPass") & "</strong></span></em>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("</table>")
            strHTML = strHTML.Append("</body>")
            strHTML = strHTML.Append("</html>")

            Dim mymail As New Emailing
            'MailSent = myfinpaymail.SendNotification(MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, Session("EmpEmail"), Session("EmployeeName").ToString, strMailFromEmail, strMailFromName)
            MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, Session("EmpEmail"), Session("EmployeeName").ToString, LoginFromEmail, LoginDisplayName, "")

            Session("MailSent") = MailSent
            'ShowGridDetails()
            LblErr.Text = "User successfully approved"
            Panel3.Visible = True
        Catch ex As Exception
            MailSent = False
        End Try

        Return MailSent
    End Function



    'Protected Sub GDUserDetails_ItemCommand(sender As Object, e As Telerik.Web.UI.GridCommandEventArgs) Handles GDUserDetails.ItemCommand
    '    ShowGridDetails()
    'End Sub







    Protected Sub SEARCH_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles SEARCH.Click
        Dim SqlAction As String = ""
        Dim searchStr As String = ""
        Dim MyDBAction As New DataManagement

        If cbosearch.SelectedValue = "U" Then
            SqlAction = "SELECT EmployeeID,EmployeeName,Email,UserName,Department FROM Employees WHERE deleted<>1 AND approved=1   AND UserName  Like '%" & Trim(txtsearch.Text) & "%'"

        ElseIf cbosearch.SelectedValue = "N" Then
            SqlAction = "SELECT EmployeeID,EmployeeName,Email,UserName,Department FROM Employees WHERE deleted<>1 AND approved=1    AND EmployeeName  Like '%" & Trim(txtsearch.Text) & "%'"

        End If


        Dim MyDatable As New Data.DataTable
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

        If MyDatable.Rows.Count > 0 Then
            GDALLOC.DataSource = MyDatable
            GDALLOC.DataBind()
            Session("DAT2") = MyDatable
            MyDatable = Nothing
        Else
            GDALLOC.DataSource = MyDatable
            GDALLOC.DataBind()
        End If
    End Sub


    Protected Sub GDALLOC_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDALLOC.DeleteCommand
        Try
            CheckBox2.Visible = True
            Label7.Visible = True

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("EmployeeID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim UserName As String = ""
            Dim EmployeeName As String = ""

            Try
                MySqlAction = "SELECT UserName,EmployeeName FROM Employees WHERE EmployeeID = " & HiddenField1.Value & ""
                MyDataTable = TryCast(MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

                If MyDataTable.Rows.Count > 0 Then
                    UserName = MyDataTable.Rows(0).Item("UserName")
                    EmployeeName = MyDataTable.Rows(0).Item("EmployeeName")
                End If
            Catch ex As Exception

            End Try

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Delete Employee", "Successfully Deleted Employee - Awaiting approval:- Employee deleted is: UserName - " & UserName & ", Name - " & EmployeeName & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            updateRecord("UPDATE   Employees SET DELETED=1 where EmployeeID= " & HiddenField1.Value.ToString & "")
            lblr.Text = "Item deleted successfully"
            HiddenField1.Value = ""

            ResetDisplayed("NewRecord")

            CmdSave.Enabled = False



        Catch ex As Exception
            lblr.Text = ex.Message

            Dim ErrMsg As String = ex.Message
        End Try
    End Sub

    Protected Sub GDALLOC_ItemDeleted(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridDeletedEventArgs) Handles GDALLOC.ItemDeleted
        Try

            CheckBox2.Visible = True
            Label7.Visible = True

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("EmployeeID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim UserName As String = ""
            Dim EmployeeName As String = ""

            Try
                MySqlAction = "SELECT UserName,EmployeeName FROM Employees WHERE EmployeeID = " & HiddenField1.Value & ""
                MyDataTable = TryCast(MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

                If MyDataTable.Rows.Count > 0 Then
                    UserName = MyDataTable.Rows(0).Item("UserName")
                    EmployeeName = MyDataTable.Rows(0).Item("EmployeeName")
                End If
            Catch ex As Exception

            End Try

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Delete Employee", "Successfully Deleted Employee - Awaiting approval:- Employee deleted is: UserName - " & UserName & ", Name - " & EmployeeName & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            updateRecord("update Employees set deleted=1 where EmployeeID= " & HiddenField1.Value.ToString & "")

            HiddenField1.Value = ""

            ResetDisplayed("NewRecord")

            CmdSave.Enabled = False



        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub



    Protected Sub GDALLOC_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GDALLOC.SelectedIndexChanged

        Dim MySmsObject As New DataManagement
        Dim SqlAction As String = ""
        Dim id As Integer = 0
        Session("Approved") = False
        Session("AddedBy") = ""
        Session("ModifiedBy") = ""
        Session("RecordStatus") = ""
        Session("AccountLocked") = False
        Session("EmailSent") = False
        Session("CurrentProfile") = ""
        txtUserName.Enabled = False

        Try
            HiddenField1.Value = (DirectCast(GDALLOC.SelectedItems(0), GridDataItem)).GetDataKeyValue("EmployeeID").ToString()
            'HiddenField1.Value = DataItem.GetDataKeyValue("EmployeeID").ToString


            SqlAction = "SELECT EmployeeID,EmployeeName,Email,UserName,Department,Title,CellPhone,ProfileID,EmailSent,Password,Approved,RecordStatus,ModifiedBy,AddedBy,EmployeeLocked,DaysTolockUser FROM Employees WHERE EmployeeID= '" & HiddenField1.Value & "'"

            Dim MyReader As SqlDataReader = TryCast(MySmsObject.DBAction(SqlAction, DataManagement.DBActionType.DataReader), SqlDataReader)

            If MyReader.HasRows Then
                MyReader.Read()

                txtEmployeeName.Text = MyReader("EmployeeName")
                txtTitle.Text = MyReader("Title")
                'txtOfficeExt.Text = MyReader("OfficeExtension")
                txtCellPhone.Text = IIf(IsDBNull(MyReader("Cellphone")), "", MyReader("Cellphone"))
                txtEmail.Text = IIf(IsDBNull(MyReader("Email")), "", MyReader("Email")) 'MyReader("Email")
                txtOtherEmail.Text = IIf(IsDBNull(MyReader("Email")), "", MyReader("Email"))
                txtUserName.Text = MyReader("UserName")
                cboprofile.SelectedValue = IIf(IsDBNull(MyReader("ProfileID")), 10, MyReader("ProfileID"))
                Session("CurrentProfile") = cboprofile.SelectedItem.Text
                txtPassword.Text = MyReader("Password")
                cbodepart.SelectedValue = IIf(IsDBNull(MyReader("Department")), 10, MyReader("Department"))

                Session("AddedBy") = IIf(IsDBNull(MyReader("AddedBy")), "", MyReader("AddedBy"))
                Session("ModifiedBy") = IIf(IsDBNull(MyReader("ModifiedBy")), "", MyReader("ModifiedBy"))
                Session("RecordStatus") = IIf(IsDBNull(MyReader("RecordStatus")), "New Record", MyReader("RecordStatus"))
                Session("Approved") = IIf(IsDBNull(MyReader("Approved")), False, MyReader("Approved"))

                Session("EmailSent") = IIf(IsDBNull(MyReader("EmailSent")), False, MyReader("EmailSent"))

                If Session("Approved") = False Then
                    Label7.Visible = False
                    CheckBox2.Visible = False

                Else
                    Label7.Visible = True
                    CheckBox2.Visible = True
                End If

                chkUserLocked2.Checked = IIf(IsDBNull(MyReader("EmployeeLocked")), False, CBool(MyReader("EmployeeLocked")))

                If chkUserLocked2.Checked = True Then
                    Session("AccountLocked") = True

                    Label7.Visible = False
                    CheckBox2.Visible = False

                Else
                    Session("AccountLocked") = False

                    If Session("Approved") = False Then
                        Label7.Visible = False
                        CheckBox2.Visible = False
                    Else
                        Label7.Visible = True
                        CheckBox2.Visible = True
                    End If
                End If


                txtDaysToLockUser.Text = IIf(IsDBNull(MyReader("DaysTolockUser")), 0, MyReader("DaysTolockUser"))
                If Val(MyReader("DaysTolockUser")) > 0 Then
                    chkAutomaticLock.Checked = True
                Else
                    chkAutomaticLock.Checked = False
                End If

                MultiView1.SetActiveView(View1)
                Session("ID") = HiddenField1.Value
                CheckBox2.Visible = True
                Label7.Visible = True
                CmdSave.Enabled = True
            End If
            MyReader.Close()


        Catch ex As Exception

        End Try

    End Sub

End Class
