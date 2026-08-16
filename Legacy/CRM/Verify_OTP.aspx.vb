Imports System.Net.Mail
Imports System.Net
Imports DocManage

Partial Class Verify_OTP
    Inherits System.Web.UI.Page
    Public EnctryptionAlgorith As String = "rijndael"
    Public LoginCount As String = ""
    'Dim LoadLicence As String
    Dim MyLastPasswordReset As String = ""
    Dim MyDatable As New Data.DataTable
    Dim MyDBAction As New DataManagement
    Dim SqlAction As String = ""
    Private CryptographyFactory As New CryptoFactory()
    Private MyEncDec As ICrypto = CryptographyFactory.MakeCryptographer()
    Public Shared SiteType As String
    Private DBAppName As String = "", DBClient As String = "", DBVersion As String = ""
    Public Shared sOTP As String = String.Empty

    Dim MailSent As Boolean = False

    Dim strMailFromEmail As String = ""
    Dim strMailFromName As String = ""
    Dim MessageSubject As String = ""

    Dim MySqlAction As String = ""

    Dim MyDataTable As New Data.DataTable
    Dim MyEncryption As New SysSettsEncryption
    Dim LoginFromEmail As String = ""
    Dim LoginDisplayName As String = ""
    Dim LoginSubject As String = ""
    Dim EmailServer As String = ""
    Dim EmailUserName As String = ""
    Dim EmailPassword As String = ""
    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            Dim otp As String = GenerateOtp()
            Session("OTP") = otp
            Session("OtpGeneratedTime") = DateTime.Now



            ' Send email to the user
            Dim userEmail As String = Session("EmpEmail") ' Replace with actual user email
            SendOtpToEmail(userEmail, otp)

        End If
    End Sub

    Private Function GenerateOtp(Optional length As Integer = 6) As String
        Dim random As New Random()
        Dim otp As String = ""
        For i As Integer = 1 To length
            otp &= random.Next(0, 10).ToString()
        Next
        Return otp
    End Function
    Protected Sub btnSubmitOtp_Click(ByVal sender As Object, ByVal e As EventArgs)
        Dim enteredOtp As String = txtOtp.Text.Trim()
        Dim sessionOtp As String = Convert.ToString(Session("OTP"))
        Dim generatedTime As DateTime = If(Session("OtpGeneratedTime"), DateTime.MinValue)

        If String.IsNullOrEmpty(sessionOtp) Then
            lblMessage.Text = "OTP not found. Please request a new one."
            Return
        End If

        ' Optional: Check if OTP expired (e.g., after 5 minutes)
        If DateTime.Now.Subtract(generatedTime).TotalMinutes > 5 Then
            lblMessage.Text = "OTP expired. Please request a new one."
            Session.Remove("OTP")
            Return
        End If

        If enteredOtp = sessionOtp Then
            lblMessage.CssClass = "text-success"
            lblMessage.Text = "OTP verified successfully."
            Response.Redirect("Welcome.aspx")
        Else
            lblMessage.Text = "Invalid OTP. Please try again."
            Response.Redirect("Login.aspx")

        End If
    End Sub
    Private Sub SendOtpToEmail(recipientEmail As String, otp As String)
        Try
            LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail1").Trim()
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName1").Trim()
            LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject1").Trim()
            EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
            EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername1").Trim()
            EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword1").Trim()
            MessageSubject = "MFA" ' System.Configuration.ConfigurationManager.AppSettings("Subject").Trim()

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
            'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>Dear " & Session("EmployeeName").ToString & ",")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Your OTP Code is :")
         
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("Your OPT  is: <em><span style='color: red'>")
            strHTML = strHTML.Append(" <strong>" & otp & "</strong></span></em>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("</table>")
            strHTML = strHTML.Append("</body>")
            strHTML = strHTML.Append("</html>")

            Dim mymail As New Emailing

            'MailSent = myfinpaymail.SendNotification(MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, Session("EmpEmail"), Session("EmployeeName").ToString, strMailFromEmail, strMailFromName)
            MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, recipientEmail, Session("EmployeeName").ToString, LoginFromEmail, LoginDisplayName, "")

            Session("MailSent") = MailSent
            'ShowGridDetails()
            lblMessage.Text = "New OTP Code generated and send to users email address!"



        Catch ex As Exception
            ' Optional: Show/log the error
            lblMessage.Text = "Failed to send email. " & ex.Message
        End Try
    End Sub
End Class
