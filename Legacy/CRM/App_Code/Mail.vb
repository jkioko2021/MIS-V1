Imports Microsoft.VisualBasic
Imports System.Data.SqlClient
Imports System.Web.Configuration
Imports System.IO
Imports System.Text
Imports System.Net.Mail
Imports Microsoft
Imports System.Diagnostics
Imports System.Net
Imports DocManage
Imports System.Data
Imports System.Globalization
Imports System.Threading
Imports System

'Imports QMailClient
Namespace Mymail
    Public Class Mail

        Public Enum FinMailType
            Approval = 1
            Exemption = 2
            Proposed = 3
            Finalized = 4
            New_User = 5
            User_Approval = 6
            ChangePassWord = 7
            NPLClients = 8
        End Enum

        Shared From As MailAddress
        Dim Mail As MailMessage

        Public Function GetBeneficiary(ByVal ID As String) As String
            Dim TempStr As String = ""
            Dim MyArray As New ArrayList
            Dim Str As String = "" : Dim Mytable As DataTable
            Dim myDbAction As New DataManagement
            Dim UserID As String = "" : Dim PassID As String = "" : Dim NamesOfUser As String = "" : Dim UserEmail As String = "" : Dim Approver As String = "" : Dim App_URL As String = ""
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            Dim SqlAction As String = ""

            Try
                Str = "SELECT EmployeeName,UserName,[Password],Email,ApprovedBy FROM Employees where EmployeeID = '" & ID & "'"
                Mytable = TryCast(myDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If Mytable.Rows.Count > 0 Then
                    UserID = Mytable.Rows(0).Item("UserName").ToString.Trim
                    NamesOfUser = Mytable.Rows(0).Item("EmployeeName").ToString.Trim
                    UserEmail = Mytable.Rows(0).Item("Email").ToString.Trim
                    PassID = Mytable.Rows(0).Item("Password").ToString.Trim
                    Approver = Mytable.Rows(0).Item("ApprovedBy").ToString.Trim
                    PassID = Cryptographer.Decrypt(PassID)
                    App_URL = WebConfigurationManager.AppSettings("AppURL").ToString

                    TempStr = "<table style='width: 100%'>"
                    TempStr = TempStr & "<tr>"
                    TempStr = TempStr & "<td>"
                    TempStr = TempStr & "Username: " & UserID
                    TempStr = TempStr & "</td>"
                    TempStr = TempStr & "</tr>"
                    TempStr = TempStr & "<tr>"
                    TempStr = TempStr & "<td>"
                    TempStr = TempStr & "Employee Names: " & NamesOfUser
                    TempStr = TempStr & "</td>"
                    TempStr = TempStr & "</tr>"
                    TempStr = TempStr & "<tr>"
                    TempStr = TempStr & "<td>"
                    TempStr = TempStr & "Password: " & PassID
                    TempStr = TempStr & "</td>"
                    TempStr = TempStr & "</tr>"
                    TempStr = TempStr & "<tr>"
                    TempStr = TempStr & "<td>"
                    TempStr = TempStr & "Application URL:  "
                    TempStr = TempStr & "<a href=" & App_URL & ">"
                    TempStr = TempStr & App_URL
                    TempStr = TempStr & "</a>"
                    TempStr = TempStr & "</td>"
                    TempStr = TempStr & "</tr>"
                    TempStr = TempStr & "</table>"
                    Mytable = Nothing
                    SqlAction = "INSERT INTO Notifications_SetUp (MsgType,MailSubject,EmailBody,Attachment,CustomerMail,dateadded,CaptureUser,MsqTemplate) "
                    SqlAction = SqlAction & "Values('006','ACCESS CREDENTIALS','Your Access Token is your secret, please donot disclose it to others.','','" & UserEmail & "',CONVERT(varchar,getdate(),120),'" & Approver & "','')"
                    myDbAction.DBAction(SqlAction, DataManagement.DBActionType.Insert)
                End If
            Catch ex As Exception

            End Try
            

            Return TempStr
        End Function

        'Public Function SendLoginDetails(ByVal EmployeeName As String, ByVal RecepientEmail As String, ByVal ccemail As String, ByVal msg As String, ByVal fileno As String, ByVal Fullname As String) As Boolean

        '    Dim MailSent As Boolean = False
        '    Dim strMailFromEmail As String = ""
        '    Dim strMailFromName As String = ""
        '    Dim MessageSubject As String = ""
        '    Dim MySqlAction As String = ""
        '    Dim MyDBAction As New DataManagement
        '    Dim MyDataTable As New Data.DataTable
        '    Dim MyEncryption As New SysSettsEncryption
        '    Dim LoginFromEmail As String = ""
        '    Dim LoginDisplayName As String = ""
        '    Dim LoginSubject As String = ""
        '    Dim EmailServer As String = ""
        '    Dim EmailUserName As String = ""
        '    Dim EmailPassword As String = ""
        '    Dim action As String = ""

        '    Try ''--Retrieve settings from db n decrypt - Mercy - 12th Apr 2011
        '        LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail").Trim()
        '        LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
        '        LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
        '        'LoginSubject = "BUSINESS ALLOCATION"
        '        EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
        '        EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername").Trim()
        '        EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword").Trim()

        '        Dim strHTML As New StringBuilder
        '        strHTML = strHTML.Append("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>")
        '        strHTML = strHTML.Append("<html xmlns='http://www.w3.org/1999/xhtml' >")
        '        strHTML = strHTML.Append("<head>")
        '        strHTML = strHTML.Append("</head>")
        '        strHTML = strHTML.Append("<body>")
        '        strHTML = strHTML.Append("<table style='width: 668px'>")
        '        strHTML = strHTML.Append("<tr>")

        '        strHTML = strHTML.Append("<td colspan='3'>")
        '        'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'> Attention:Relationship Managers")
        '        strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>ATT:Team </u></b> </span>")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<br />")
        '        MessageSubject = "'" & fileno & " ' "
        '        strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & msg & " </b></span>")

        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No:" & fileno & " </b></span>")
        '        strHTML = strHTML.Append("<br />")
        '        'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Client Name: " & txtProposer.Text & " </b></span>")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date : " & Date.Now() & " </b></span>")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Forwaded By : " & Fullname & " </b></span>")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("----------------------------------------Notes--------------------------------------------------------")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("" & txtcomment.Text & "")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("<br />")
        '        strHTML = strHTML.Append("----------------------------------------End--------------------------------------------------------------------")
        '        strHTML = strHTML.Append("<br />")

        '        strHTML = strHTML.Append("<span style='font-size: 11pt; font-color:RED; font-family: Calibri'><b><i>THIS IS A SYSTEM GENERATED EMAIL.DO NOT REPLY!.</i></b>")
        '        'Membership Enquiry (membershipenquiry@aar.co.ke)
        '        strHTML = strHTML.Append("<br />")

        '        strHTML = strHTML.Append("</table>")
        '        strHTML = strHTML.Append("</body>")
        '        strHTML = strHTML.Append("</html>")
        '        Dim mymail As New Emailing
        '        MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName, ccemail)
        '        Return MailSent
        '    Catch ex As Exception
        '        'MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
        '        MailSent = False
        '    End Try

        '    Return MailSent
        'End Function
        Private Sub SendingEmail(ByVal toEmail As String, ByVal Subj As String, ByVal Ebody As String)
            Dim ePasst As String = WebConfigurationManager.AppSettings("EmailPassword").ToString
            Dim EnctryptionAlgorith As String = "rijndael"
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
            ePasst = Cryptographer.Decrypt(ePasst)

            Dim strMailFromEmail As String = ""
            Dim oMsg = New MailMessage()
            Dim strHTML As String = ""

            'Get the Email address sending the mail
            strMailFromEmail = WebConfigurationManager.AppSettings("EmailAddress").ToString
            oMsg.From = New MailAddress(strMailFromEmail, "Mis Administrator")
            Dim oSmtp = New SmtpClient(WebConfigurationManager.AppSettings("EmailServer").ToString)
            Dim oSmtport As Int16 = Val(WebConfigurationManager.AppSettings("PortNo").ToString)

            Dim SmtpServer As New SmtpClient()
            SmtpServer.Credentials = New Net.NetworkCredential(strMailFromEmail, ePasst)
            SmtpServer.Port = oSmtport
            SmtpServer.Host = WebConfigurationManager.AppSettings("EmailServer").ToString
            SmtpServer.EnableSsl = False


            Mail = New MailMessage()
            Dim addr As String = toEmail
            Try
                Mail.From = New MailAddress(strMailFromEmail,
                    "FINMIS USER", System.Text.Encoding.UTF8)

                Dim i As Byte
                For i = 0 To addr.Length - 1
                    Mail.To.Add(addr)
                Next
                Mail.Subject = Subj
                Mail.Body = Ebody
                Mail.IsBodyHtml = True
                'If ListBox1.Items.Count <> 0 Then
                '    For i = 0 To ListBox1.Items.Count - 1
                '    mail.Attachments.Add(New Attachment
                '        (ListBox1.Items.Item(i)))
                '    Next
                'End If
                Mail.DeliveryNotificationOptions =
                        DeliveryNotificationOptions.OnFailure

                'Mail.ReplyToList = New MailAddress("rwambugu@fintech.co.ke")
                'Mail.ReplyTo = Mail.To
                Mail.To.Add(addr)
                SmtpServer.Send(Mail)
            Catch ex As Exception
                MsgBox(ex.ToString())
            End Try
        End Sub
        
        Public Sub Fin_Mail(ByVal MyMailType As FinMailType, Optional ByVal MyIntro As String = "")
            Try
                Dim MyDbAction As New DataManagement
                Dim MyTable As Data.DataTable
                Dim Str As String = ""
                Dim IntroDesc As String = ""
                Select Case MyMailType
                    Case 1 'Approval
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='001'"
                        IntroDesc = "."
                    Case 2 'Exemption
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='002'"
                        IntroDesc = "T"
                    Case 3 'Proposed
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='003'"
                        IntroDesc = ""
                    Case 4 'Finalized
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='004'"
                        IntroDesc = ""
                    Case 5 'New_User
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='005'"
                        IntroDesc = "A New system User has been Created"
                    Case 6 'User_Approval
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='006'"
                        IntroDesc = "System user has been Approved to access MisReports"
                    Case 7 'ChangePassWord
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='007'"
                        IntroDesc = "A System has Successfully changed his/her system password."
                    Case 8 'NPLClients
                        Str = "SELECT * FROM Notifications_SetUp where MsgType='008'"
                        IntroDesc = "Test this"
                End Select

                

                If Str <> "" Then
                    'we need to establish that the mail has been set/defined first

                    MyTable = TryCast(MyDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                    If MyTable.Rows.Count > 0 Then
                        Dim strMailFromEmail As String = ""
                        Dim oMsg = New MailMessage()
                        Dim strHTML As String = ""

                        'Get the Email address sending the mail
                        strMailFromEmail = WebConfigurationManager.AppSettings("EmailAddress1").ToString
                        oMsg.From = New MailAddress(strMailFromEmail, "MisReports Administrator")
                        Dim oSmtp = New SmtpClient(WebConfigurationManager.AppSettings("EmailServer").ToString)
                        Dim oSmtport As Int16 = Val(WebConfigurationManager.AppSettings("PortNo").ToString)
                        'get the mail body and the mail subject
                        Dim MailSubject As String = "" : Dim Mybody As String = "" : Dim Mytemplate As String = "" : Dim MyID As String = ""
                        MailSubject = MyTable.Rows(0).Item("MailSubject").ToString
                        Mybody = MyTable.Rows(0).Item("EmailBody").ToString
                        Mytemplate = MyTable.Rows(0).Item("MsqTemplate").ToString
                        MyID = MyTable.Rows(0).Item("MsgType")

                        'Lets assign our mail a subject
                        oMsg.Subject = MailSubject

                        'Now we need to get the Array of receipients
                        Dim MailAddresses As ArrayList
                        Dim ReceipientMail As String : Dim NoticeID As String
                        ReceipientMail = MyTable.Rows(0).Item("CustomerMail").ToString
                        NoticeID = MyTable.Rows(0).Item("ID").ToString
                        'MailAddresses = GetReceipients(MyID, ReceipientMail) ' Some function
                        oMsg.To.Add(New MailAddress(ReceipientMail))

                        'loop through the array and add the emails to our mail
                        'For y As Integer = 0 To MailAddresses.Count - 1
                        '    Dim MyEmailAddress As String = MailAddresses(y).ToString
                        '    oMsg.To.Add(New MailAddress(MyEmailAddress))
                        'Next

                        'struncture the body of the email
                        strHTML = "<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>"
                        strHTML = strHTML & "<html xmlns='http://www.w3.org/1999/xhtml' >"
                        strHTML = strHTML & "<head>"
                        strHTML = strHTML & "</head>"
                        strHTML = strHTML & "<body>"

                        strHTML = strHTML & "Dear User, <p><p>"
                        strHTML = strHTML & "<table><tr><td><hr/></td></tr>"
                        strHTML = strHTML & "<tr><td><b>Approver Details</b></td></tr>"
                        strHTML = strHTML & "<tr><td>" & IntroDesc & "</td></tr>"
                        strHTML = strHTML & "<tr><td>" & MyIntro & "</td></tr>"
                        strHTML = strHTML & "<tr><td><hr/></td></tr>"
                        strHTML = strHTML & "<tr><td>" & Mybody & "</td></tr>"
                        strHTML = strHTML & "<tr><td></td></tr></table>"

                        strHTML = strHTML & "</body>"
                        strHTML = strHTML & "</html>"

                        'Now assign the structured Body to the mail
                        oMsg.Body = strHTML.ToString
                        oMsg.IsBodyHtml = True

                        'now we need to start sending the email for real
                        oSmtp.DeliveryMethod = SmtpDeliveryMethod.Network
                        oSmtp.Port = 587
                        Dim ePasst As String = WebConfigurationManager.AppSettings("EmailPassword1").ToString
                        'Dim EnctryptionAlgorith As String = "rijndael"
                        'Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
                        'Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
                        'ePasst = Cryptographer.Decrypt(ePasst)
                        Dim oCredential = New System.Net.NetworkCredential(WebConfigurationManager.AppSettings("EmailUsername1").ToString, ePasst)
                   
                        'oSmtp.DeliveryMethod = SmtpDeliveryMethod.Network
                        oSmtp.UseDefaultCredentials = False
                        oSmtp.EnableSsl = False


                        Try



                            'SendingEmail(ReceipientMail, MailSubject, strHTML)
                            oSmtp.Send(oMsg)
                            MyDbAction.DBAction("DELETE Notifications_SetUp WHERE ID=" & NoticeID & "", DataManagement.DBActionType.Delete)

                            'if it does not fail...we proceed
                        Catch ex As Exception
                            'in case the mail is not sent, we need to insert the mail in a table so that we can send it later.
                            Try
                                'incase of delays retry
                                oSmtp.Send(oMsg)
                                MyDbAction.DBAction("DELETE Notifications_SetUp WHERE ID=" & NoticeID & "", DataManagement.DBActionType.Delete)
                            Catch exs As Exception
                                MsgBox("Failed to send")
                            End Try
                        End Try
                    End If

                End If
            Catch ex As Exception
                'in case the mail is not sent, Log that this has failed beyond resending
            Finally

            End Try
        End Sub
        Private Function GetReceipients(ByVal MsgID As String, ByVal Owner As String) As ArrayList
            Dim MyArray As New ArrayList
            Dim Str As String = "" : Dim Mytable As DataTable
            Dim myDbAction As New DataManagement

            Str = "SELECT * FROM Recipients WHERE MSQID='" & MsgID & "'"
            Mytable = TryCast(myDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If Mytable.Rows.Count > 0 Then
                Select Case Owner
                    Case "USERS"
                        For x As Integer = 0 To Mytable.Rows.Count - 1
                            Dim MyTable2 As DataTable
                            Str = "SELECT * FROM Employees where EmployeeID='" & Mytable.Rows(x).Item("Recipient").ToString & "'"
                            MyTable2 = TryCast(myDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                            For y As Integer = 0 To MyTable2.Rows.Count - 1
                                Dim MyEmailAddress As String = MyTable2.Rows(y).Item("Email").ToString
                                MyArray.Add(New MailAddress(MyEmailAddress))
                            Next
                            MyTable2 = Nothing
                        Next
                    Case "PROFILES"
                        For x As Integer = 0 To Mytable.Rows.Count - 1
                            Dim MyTable2 As DataTable
                            Str = "SELECT * FROM Employees where ProfileID='" & Mytable.Rows(x).Item("Recipient").ToString & "'"
                            MyTable2 = TryCast(myDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                            For y As Integer = 0 To MyTable2.Rows.Count - 1
                                Dim MyEmailAddress As String = MyTable2.Rows(y).Item("Email").ToString
                                MyArray.Add(New MailAddress(MyEmailAddress))
                            Next
                            MyTable2 = Nothing
                        Next
                    Case Else
                        Dim MyTable2 As DataTable
                        Str = "SELECT * FROM Employees where Approved=1 and Email is not null"

                        MyTable2 = TryCast(myDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
                        For y As Integer = 0 To MyTable2.Rows.Count - 1
                            Dim MyEmailAddress As String = MyTable2.Rows(y).Item("Email").ToString
                            MyArray.Add(New MailAddress(MyEmailAddress))
                        Next
                        MyTable2 = Nothing
                End Select
            End If
            Mytable = Nothing
            Return MyArray

        End Function
        Public Function GetIntro(ByVal Header1 As String, ByVal Header2 As String, ByVal Header3 As String) As String
            Dim MyIntro As String = ""

            MyIntro = "<table style='width: 100%'>"
            MyIntro = MyIntro & "<tr><td colspan='3'><hr/></td></tr>"

            MyIntro = MyIntro & "<tr>"
            MyIntro = MyIntro & "<td>"
            MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Header1 & "</u></b></span>"
            MyIntro = MyIntro & "</td>"
            MyIntro = MyIntro & "<td>"
            MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Header2 & "</u></b></span>"
            MyIntro = MyIntro & "</td>"
            MyIntro = MyIntro & "<td>"
            MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Header3 & "</u></b></span>"
            MyIntro = MyIntro & "</td>"
            MyIntro = MyIntro & "</tr>"

            Return MyIntro
        End Function
    End Class
End Namespace

