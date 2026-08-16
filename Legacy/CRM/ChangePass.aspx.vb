Imports DocManage
Imports System.Net
Imports Mymail
Imports System.Data.SqlClient
Imports System.Web.Configuration

Partial Class ChangePass
    Inherits System.Web.UI.Page
    Public EnctryptionAlgorith As String = "rijndael"
    Dim MyDbAction As New DataManagement
    Dim SendMail As New Mail

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        If Not Page.IsPostBack Then
            If Session("UserName") IsNot Nothing Then
                RadTxtUserName.Text = Session("UserName")
            Else
                'Response.Redirect("Login.aspx")
            End If
        End If
        LblErr.Text = ""
        Panel3.Visible = False
    End Sub

    Protected Sub RadBtnCancel_Click(sender As Object, e As System.EventArgs) Handles RadBtnCancel.Click
        Response.Redirect("Login.aspx")
    End Sub

    Protected Sub RadBtnChangePass_Click(sender As Object, e As System.EventArgs) Handles RadBtnChangePass.Click
        Try
            Dim Str As String : Dim Mytable As Data.DataTable
            Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
            Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

            Str = "Select top 1 * from Employees where EmployeeID ='" & Session("MyEmployeeID") & "'"
            Mytable = TryCast(MyDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            If Mytable.Rows.Count > 0 Then
                Dim MyEncrptedPass As String = Cryptographer.Decrypt(Mytable.Rows(0).Item("Password").ToString)
                If MyEncrptedPass <> RadTxtOldPass.Text Then
                    LblErr.Text = "Incorrect Old Password"
                    Panel3.Visible = True
                    Mytable = Nothing
                    Exit Sub
                End If

                If MyEncrptedPass = RadTxtnewpass.Text Then
                    LblErr.Text = "You cannot use the Previous password!"
                    Panel3.Visible = True
                    Mytable = Nothing
                    Exit Sub
                End If
                'CHECK THAT THE NEW PASSWORD MATCHES THE CONFIRMED PASSWORD
                If RadTxtnewpass.Text <> RadTxtConfirm.Text Then
                    LblErr.Text = "The new password do not match"
                    Panel3.Visible = True
                    Mytable = Nothing
                    Exit Sub
                Else
                    Dim passStrength As New CPasswordStrength
                    passStrength.MinimumPasswordLength = 4
                    passStrength.NumberofChecktoSucceed = 4


                    If passStrength.isPasswordStrong(RadTxtnewpass.Text.Trim) = False Then
                        LblErr.Text = passStrength.Reasonfailed
                        Panel3.Visible = True
                        Exit Sub
                    End If


                    MyEncrptedPass = Cryptographer.Encrypt(RadTxtnewpass.Text)
                    Str = "Update Employees set Password = '" & MyEncrptedPass & "', Activated = 1,LASTPASSWORDRESET = '" & CDate(Date.Today).ToString("yyyy-MM-dd") & "'  where EmployeeID = " & Session("MyEmployeeID") & ""
                    If MyDbAction.UpdateDB(Str) = True Then
                        LblErr.Text = "Password Changed Successfully."
                        Panel3.Visible = True

                        Dim MyIntro As String = ""
                        MyIntro = SendMail.GetIntro("USER ID", "USERNAME", "NAMES")

                        MyIntro = MyIntro & "<tr>"
                        MyIntro = MyIntro & "<td>"
                        MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Session("MyEmployeeID") & "</u></b></span>"
                        MyIntro = MyIntro & "</td>"
                        MyIntro = MyIntro & "<td>"
                        MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Session("UserName") & "</u></b></span>"
                        MyIntro = MyIntro & "</td>"
                        MyIntro = MyIntro & "<td>"
                        MyIntro = MyIntro & "<span style='font-size: 11pt; font-family: Calibri'><b><u>" & Session("FullNames") & "</u></b></span>"
                        MyIntro = MyIntro & "</td>"
                        MyIntro = MyIntro & "</tr>"
                        MyIntro = MyIntro & "</table>"

                        SendMail.Fin_Mail(Mail.FinMailType.ChangePassWord, MyIntro)
                    Else
                        LblErr.Text = "Unable to change the Password"
                        Panel3.Visible = True
                        Mytable = Nothing
                        Exit Sub
                    End If
                End If
                Mytable = Nothing
            Else
                LblErr.Text = "User Not Found In the System."
                Panel3.Visible = True
                Exit Sub
            End If
        Catch ex As Exception
            LblErr.Text = ex.Message.ToString
            Panel3.Visible = True
            MyDbAction.DoLogs("Class==ChangePass.vb: Protected Sub RadBtnChangePass_Click" & " : Error : " & ex.Message)
        End Try
    End Sub

    Protected Sub RadTxtnewpass_TextChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles RadTxtnewpass.TextChanged

    End Sub

    
End Class
