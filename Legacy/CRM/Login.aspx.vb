Imports System.Data.SqlClient
Imports DocManage
Imports System.Web.Configuration
Imports System.Windows.Forms

Partial Class LoginRedesigned
    Inherits System.Web.UI.Page

    Public EnctryptionAlgorith As String = "rijndael"
    Public LoginCount As String = ""
    Public Shared sOTP As String = String.Empty
    'Dim LoadLicence As String
    Dim MyLastPasswordReset As String = ""
    Dim MyDatable As New Data.DataTable
    Dim MyDBAction As New DataManagement
    Dim SqlAction As String = ""
    Private CryptographyFactory As New CryptoFactory()
    Private MyEncDec As ICrypto = CryptographyFactory.MakeCryptographer()
    Public Shared SiteType As String
    Private DBAppName As String = "", DBClient As String = "", DBVersion As String = ""

    Dim my_reader As SqlDataReader
    Dim MailSent As Boolean = False
    Dim my_object As New DataManagement
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

    Private Sub Machine_IP_Session()
        Dim ip As String
        ip = Request.ServerVariables("HTTP_X_FORWARDED_FOR")
        If ip = Nothing Then
            ip = ""
        End If

        ' If there is no proxy, get the standard remote address 
        If ip = "" Or ip.ToLower() = "unknown" Then
            ip = Request.ServerVariables("REMOTE_ADDR").ToString
        End If
        '---------
        Session("ip") = ip
        Session("sessionid") = Session.SessionID.ToString()

    End Sub

    Private Function LoginDetailsTrue1() As String

        Dim MyLoginCount1 As Int16 = 0
        Dim MyMaxLogin As Int16 = 0
        Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
        Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

        Dim Disclaimer As Boolean = False

        Dim MySmsObject As New DataManagement

        Dim Myreader As SqlDataReader = Nothing
        Dim MyClientPreferencesReader As SqlDataReader = Nothing

        Try
            Dim MyActivate As Int16 = 0
            Dim MyClientLock As Int16 = 0
            Dim reply As String = ""
            Dim ClientApproved As Int16 = 0
            Dim MyEmployeeLocked As System.Int16 = 0

            '--This section has been moved up here since we need it whether recs r retrieved or not
            'Get the ip of the machine being used by user---

            Myreader = UserDetails(txtUserName.Text)

            If Not IsNothing(Myreader) Then
                If Myreader.HasRows Then

                    Myreader.Read()

                    Dim MyEncrptedPass As String = Cryptographer.Decrypt(Myreader("Password"))
                    'Dim MyEncrptedPass As String = Cryptographer.Encrypt("password")

                    ''Session("CanDoDeletion") = IIf(IsDBNull(Myreader("CanDoDeletion")), False, Myreader("CanDoDeletion"))

                    MyLastPasswordReset = IIf(IsDBNull(Myreader("LASTPASSWORDRESET")), "", Myreader("LASTPASSWORDRESET"))

                    If txtPassword.Text.ToString.Trim = MyEncrptedPass.Trim() Then
                       
                        'Session("sessionid") = Session.SessionID.ToString
                        Session("UserName") = Myreader("UserName")
                        Session("MyEmployeeID") = Myreader("EmployeeID")
                        Session("Email") = Myreader("Email")
                        Session("FullNames") = Myreader("EmployeeName")

                        Session("MyProfileID") = Myreader("ProfileID")
                        Session("emp_code") = Myreader("emp_code")

                        Session("LastLoginDate") = IIf(IsDBNull(Myreader("LastLoginDate")), Date.Now, Myreader("LastLoginDate"))

                        ''MyClientLock = IIf(IsDBNull(Myreader("Locked")) = True, 0, Myreader("Locked"))
                        MyActivate = IIf(IsDBNull(Myreader("Activated")) = True, 0, Myreader("Activated"))
                        ClientApproved = IIf(IsDBNull(Myreader("APPROVED")) = True, 0, Myreader("APPROVED"))
                        MyEmployeeLocked = IIf(IsDBNull(Myreader("EmployeeLocked")), 0, Myreader("EmployeeLocked"))

                        ''Session("ActiveSession") = Myreader("ActiveSession")

                        Dim MyClientLock1 As Boolean = CBool(MyClientLock)
                        Dim MyActivate1 As Boolean = CBool(MyActivate)
                        Dim ClientApproved1 As Boolean = CBool(ClientApproved)
                        Dim MyEmployeeLocked1 As Boolean = CBool(MyEmployeeLocked)

                        ''If MyActivate1 = True AndAlso MyClientLock1 = False AndAlso ClientApproved1 = True Then
                        If MyActivate1 = True AndAlso MyEmployeeLocked1 = False AndAlso ClientApproved1 = True Then

                            LogAccessDetails()


                            reply = "CannAccess"

                        ElseIf (MyActivate1 = True Or MyActivate1 = False) AndAlso MyEmployeeLocked1 = True AndAlso ClientApproved1 = True Then
                            reply = "ClientLocked"

                        ElseIf MyActivate1 = True AndAlso MyEmployeeLocked1 = False AndAlso ClientApproved1 = False Then
                            reply = "ClientNeedsApproval"

                            ''ElseIf MyActivate1 = False AndAlso MyClientLock1 = False AndAlso ClientApproved1 = False Then
                            ''    reply = "ClientNeedsApproval"

                        ElseIf MyActivate1 = False AndAlso MyEmployeeLocked1 = False AndAlso ClientApproved1 = True Then
                            reply = "NeedActivation"
                        Else
                            reply = "ClientNeedsApproval"
                        End If
                    Else
                        reply = "InvalidDetails 1"
                        'count number of login attempts
                        Session("Loginattempts") = Val(Session("Loginattempts")) + 1
                    End If

                Else
                    reply = "InvalidDetails 2"
                    'count number of login attempts
                    Session("Loginattempts") = Val(Session("Loginattempts")) + 1

                End If

            Else
                reply = "InvalidDetails 3"

                'count number of login attempts
                Session("Loginattempts") = Val(Session("Loginattempts")) + 1
            End If

            Myreader.Close()

            Return reply


        Catch ex As Exception
        Finally
            If Not IsNothing(Myreader) Then
                Myreader.Close()
            End If
        End Try
    End Function

    Public Function UserDetails(ByVal MyUserName As String) As SqlDataReader

        Dim EnctryptionAlgorith As String = "rijndael"
        Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
        Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)

        'Dim DecryptedStr As String = Cryptographer.Encrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)
        Dim DecryptedStr As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)


        'Dim DecryptedStrng As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("eoxegen").ConnectionString)
        'Dim DecryptedStrn_LIve As String = Cryptographer.Decrypt(WebConfigurationManager.ConnectionStrings("eoxegen_Live").ConnectionString)
        'Dim DecryptedStr_ As String = Cryptographer.Encrypt(WebConfigurationManager.ConnectionStrings("eoxegen").ConnectionString)
        'Dim DecryptedStrX As String = Cryptographer.Encrypt(WebConfigurationManager.ConnectionStrings("CRM").ConnectionString)

        Dim myConnection As New SqlConnection(DecryptedStr)
        myConnection.Open()


        Dim MyDataReader As SqlDataReader = Nothing

        Try

            Dim myCommand As New SqlCommand("AdminLogin", myConnection)


            With myCommand
                .CommandType = Data.CommandType.StoredProcedure
                .Parameters.Add("@UserName", Data.SqlDbType.VarChar, 50).Value = MyUserName
                MyDataReader = .ExecuteReader(Data.CommandBehavior.CloseConnection)
            End With

            Return MyDataReader

        Catch ex As Exception

        Finally
            If IsNothing(MyDataReader) = True Then
                myConnection.Close()
                myConnection.Dispose()
            End If
        End Try

    End Function

    Private Sub LogAccessDetails()
        Dim MySmsObject As New DataManagement

        Dim MySqlAction As String = ""
        MySqlAction = "Update Employees set LastLoginDate = Getdate() where EmployeeID = " & Session("MyEmployeeID") & ""

        MySmsObject.DBAction(MySqlAction, DataManagement.DBActionType.Update)
    End Sub

    'Protected Sub CmdClear_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdClear.Click
    '    txtUserName.Text = ""
    '    txtPassword.Text = ""
    '    Label1.Text = ""
    'End Sub

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

        Session("FixAjaxSysBug") = True

        If Not Page.IsPostBack Then
            ' Determine current view
            'LoadLicence(Date.Now)
            LoadLicence(MyDBAction.GetSqlDate(Date.Today))

            txtusername.Focus()
            Panel1.Visible = False
            

            SqlAction = "SELECT [Staff_On_Call],[Staff_Mobile] FROM [CRM].[dbo].[TBL_MIS_CRM_STAFF_ON_CALL] WHERE [Date]=CONVERT(char(10), GetDate(),126)"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                name.Text = MyDatable.Rows(0).Item("Staff_On_Call").ToString() & ":" & MyDatable.Rows(0).Item("Staff_Mobile").ToString()
            End If
        End If
    End Sub

    Private Function LoadSetup_Parameter() As String
        Dim TempStr, MyLincStr, SetupStr, OtherStr As String
        Dim MyDBAction As New DataManagement
        Dim MyDatable As New Data.DataTable
        Dim i, j As Integer

        TempStr = ""
        MyLincStr = "AIK-Linc"
        DBClient = ""
        DBAppName = ""
        DBVersion = ""
        SetupStr = ""
        OtherStr = ""
        Try
            If Not IsNothing(MyDatable) Then
                MyDatable.Rows.Clear()
                MyDatable.Columns.Clear()
                MyDatable.Clear()
            End If
            'TempStr = "SELECT Code,Value_Str from dbo.LoadParamz ('" & MyLincStr & "')"
            TempStr = "SELECT Code,Value_Str from dbo.LoadParamz"
            MyDatable = TryCast(MyDBAction.DBAction(TempStr, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                j = MyDatable.Rows.Count - 1
                For i = 0 To j
                    TempStr = IIf(IsDBNull(MyDatable.Rows(i).Item(0)), "", MyDatable.Rows(i).Item(0).ToString.Trim)
                    If TempStr.Trim = "FinLincClientName" Then
                        DBClient = IIf(IsDBNull(MyDatable.Rows(i).Item(1)), "", MyDatable.Rows(i).Item(1).ToString.Trim)
                        'LOAD THIS INTO A SESSION
                        Session("INSTITUTION") = DBClient

                    ElseIf TempStr.Trim = "FinLincAppName" Then
                        DBAppName = IIf(IsDBNull(MyDatable.Rows(i).Item(1)), "", MyDatable.Rows(i).Item(1).ToString.Trim)
                    ElseIf TempStr.Trim = "FinLincVersion" Then
                        DBVersion = IIf(IsDBNull(MyDatable.Rows(i).Item(1)), "", MyDatable.Rows(i).Item(1).ToString.Trim)
                    Else
                        OtherStr = IIf(IsDBNull(MyDatable.Rows(i).Item(1)), "", MyDatable.Rows(i).Item(1).ToString.Trim)
                    End If
                Next i
                SetupStr = DBClient & "/" & DBAppName & "/" & DBVersion & "/" & OtherStr & "/"
            End If

        Catch ex As Exception

        Finally
            If Not IsNothing(MyDatable) Then
                MyDatable.Rows.Clear()
                MyDatable.Columns.Clear()
                MyDatable.Clear()
            End If
        End Try

        Return SetupStr
    End Function

    Private Function LoadLicence(ByVal SystemDate As Date) As Boolean
        ' Before even starting declare current license as obsolete
        LoadLicence = True
        '------------------------------------------------------
        ' Read License Information from from File
        '------------------------------------------------------
        Dim pos, count As Integer
        Dim myInstream As System.IO.StreamReader
        Dim InfoStr, CategoryStr, Lnstr As String
        Dim StrLen As Integer
        Dim AppName As String = "", Client As String = "", Version As String = ""
        Dim StartDate, EndDate As Date
        Dim WholeString As String = ""
        Dim TempStrTwo As String = ""
        Dim TempStrOne As String = ""
        Dim LnValue As String = ""
        Dim LicensePeriod As Integer = 0
        Dim WebsitePath As String = ""
        Dim LincenseStr As String
        'EndDate = "2023-12-19"
        LincenseStr = ""
        count = 0
        Try
            'Load license details from DB Setup parameter
            LincenseStr = LoadSetup_Parameter()
            Lnstr = " "
            InfoStr = " "
            CategoryStr = " "
            WebsitePath = Server.MapPath("")

            'check if file or dbparamter setup values exists
            If Not System.IO.File.Exists(WebsitePath & "\License.fin") = True Or DBClient.Trim.Length <= 0 Or DBAppName.Trim.Length <= 0 Or DBVersion.Trim.Length <= 0 Then
                LoadLicence = False
                lblMessage.Text = "License file cannot be found, contact system administrator " & WebsitePath & "\License.fin"
                Exit Function
            End If

            If DBClient.Trim.Length <= 0 Or DBAppName.Trim.Length <= 0 Or DBVersion.Trim.Length <= 0 Then
                LoadLicence = False
                lblMessage.Text = "Data License file cannot be found, contact system administrator " & WebsitePath & "\License.fin"
                Exit Function
            End If

            myInstream = System.IO.File.OpenText(WebsitePath & "\License.fin")

            ' Read the whole Text File
            Do While Not myInstream.EndOfStream
                Lnstr = myInstream.ReadLine
                Lnstr = MyEncDec.Decrypt(Lnstr) ' Decrypt the encrypted text
                Lnstr = StrReverse(Lnstr)
                WholeString = Lnstr.Trim
            Loop

            StrLen = WholeString.Trim.Length

            'close the file stream to avoid any errors
            myInstream.Close()
            myInstream.Dispose()
            myInstream = Nothing

            pos = WholeString.IndexOf(":")
            Do While pos >= 3 'Enter key
                Lnstr = WholeString.Substring(0, pos)
                If Lnstr.Trim.Length >= 5 Then
                    LnValue = Lnstr.Substring(0, pos).Trim
                    If LnValue = "[STARTDATE]" Then ' dd/MM/yyyy
                        'Shorten the string
                        pos = pos + 1
                        WholeString = WholeString.Substring(pos, StrLen - pos)
                        StrLen = WholeString.Length
                        pos = WholeString.IndexOf(":")
                        TempStrOne = WholeString.Substring(0, pos)
                        TempStrOne = Replace(TempStrOne, ":", "").Trim
                        StartDate = CDate(TempStrOne)
                    ElseIf LnValue = "[ENDDATE]" Then ' dd/MM/yyyy
                        'Shorten the string
                        pos = pos + 1
                        WholeString = WholeString.Substring(pos, StrLen - pos)
                        StrLen = WholeString.Length
                        pos = WholeString.IndexOf(":")
                        TempStrTwo = WholeString.Substring(0, pos)
                        TempStrTwo = Replace(TempStrTwo, ":", "").Trim
                        'TempStrTwo = "06/20/2010"
                        EndDate = CDate(TempStrTwo)
                    ElseIf LnValue = "[AppName]" Then
                        'Shorten the string
                        pos = pos + 1
                        WholeString = WholeString.Substring(pos, StrLen - pos)
                        StrLen = WholeString.Length
                        pos = WholeString.IndexOf(":")
                        AppName = WholeString.Substring(0, pos)
                    ElseIf LnValue = "[Client]" Then
                        'Shorten the string
                        pos = pos + 1
                        WholeString = WholeString.Substring(pos, StrLen - pos)
                        StrLen = WholeString.Length
                        pos = WholeString.IndexOf(":")
                        Client = WholeString.Substring(0, pos)
                    ElseIf LnValue = "[Version]" Then
                        'Shorten the string
                        pos = pos + 1
                        WholeString = WholeString.Substring(pos, StrLen - pos)
                        StrLen = WholeString.Length
                        Version = WholeString
                        pos = 0
                    End If
                End If
                'Shorten the string
                pos = pos + 1
                WholeString = WholeString.Substring(pos, StrLen - pos)
                StrLen = WholeString.Length
                pos = WholeString.IndexOf(":")
            Loop 'End of Fetching info

            If StartDate = Nothing Then
                LoadLicence = False
                Exit Function
            End If

            If EndDate = Nothing Then
                LoadLicence = False
                Exit Function
            End If

            If Client.ToLower.Trim <> DBClient.ToLower.Trim Then
                LoadLicence = False
                lblMessage.Text = "The software license applied is not valid for this Client"
                Exit Function
            End If

            If Version.ToLower.Trim <> DBVersion.ToLower.Trim Then
                LoadLicence = False
                lblMessage.Text = "The software version applied is not valid for this Client"

                Exit Function
            End If

            If AppName.ToLower.Trim <> DBAppName.ToLower.Trim Then
                LoadLicence = False
                lblMessage.Text = "The software license applied is not valid for this application"
                Exit Function
            End If

            If StartDate > EndDate Then ' if start date is greater than enddate
                LoadLicence = False
                lblMessage.Text = "The software license applied is not valid"
                Exit Function
            End If

            If SystemDate < StartDate Then ' if systemdate is less than startdate
                LoadLicence = False
                lblMessage.Text = "The system has detected that you have Changed the Machine date and will terminate"
                Exit Function
            End If

            If SystemDate > EndDate Then ' if systemdate is greater than enddate
                LoadLicence = False
                ' lblMessage.Text =  "License has Expired please contact the system administrator"
                Exit Function
            End If
            Session("LicenseExpiryDays") = Nothing
            Session("LoadLicence") = LoadLicence
            REM warn user if days diff of the license and the server date is less or equal to one month
            Dim DaysToExpiry As Integer = 0
            If LoadLicence = True Then
                DaysToExpiry = DateDiff(DateInterval.Day, SystemDate, EndDate)

                If DaysToExpiry < 30 Then ' if days between the systemdate and the enddate is less than 30 days
                    'Session("LicenseExpiryDays") = DaysToExpiry
                    'LblStatus.Text = "License will expire in " & DaysToExpiry & " Days "
                    lblMessage.Text = "" ''"License will expire in " & Session("LicenseExpiryDays") & " Days "
                End If


            End If

        Catch ex As Exception
            LoadLicence = False
            lblMessage.Text = "Could not Resolve License Information. Please contact system Administrator"
            Exit Function
        Finally

        End Try
        Return LoadLicence
    End Function

    'Protected Sub btnShowPopup_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnShowPopup.Click
    Public Sub OTP()
        Dim my_sql As String = ""
        my_sql = "select EmployeeName,Approved,Email,UserName from employees where employeeID = '" & Session("MyEmployeeID") & "' "
        my_reader = my_object.DBAction(my_sql, DataManagement.DBActionType.DataReader)
        If my_reader.HasRows Then
            my_reader.Read()
            Session("EmpEmail") = IIf(IsDBNull(my_reader("Email")) = True, "", my_reader("Email").ToString.Trim)
            'Session("EmpUsername") = IIf(IsDBNull(my_reader("UserName")) = True, "", my_reader("UserName").ToString.Trim)
            Session("EmployeeName") = IIf(IsDBNull(my_reader("EmployeeName")) = True, "", my_reader("EmployeeName").ToString.Trim)

            Dim otp As String = GenerateOtp()
            Session("OTP") = otp
            Session("OtpGeneratedTime") = DateTime.Now



            ' Send email to the user
            Dim userEmail As String = Session("EmpEmail") ' Replace with actual user email
            SendOtpToEmail(userEmail, otp)
        End If
    End Sub
    Protected Sub Btns_Click(sender As Object, e As System.EventArgs) Handles cmdLogin.Click
        lblMessage.Text = ""




        Dim username As String = txtusername.Text
        Dim password As String = txtpassword.Text


        Try
            Call Machine_IP_Session()
            Dim MyDBAction As New DataManagement
            Dim MyUsername As String

            If Not LoadLicence(MyDBAction.GetSqlDate(Date.Today)) Then
                Exit Sub

            End If

            MyUsername = txtusername.Text.Trim
            If MyUsername.Contains("--") Or MyUsername.Contains("'") Then
                lblMessage.Text = "Invalid Login Details!"

                txtpassword.Focus()

                'AUDIT TRAIL-------
                Dim audit As New DataManagement
                audit.AddAdminAuditTrail(MyUsername, "Login", "Unsuccessful Login. Invalid login details.", _
                Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                ''----END AUDIT TRAIL-----

                Exit Sub
            End If






            Try
                Dim LoginReply As String = ""

                If Page.IsValid Then


                    LoginReply = LoginDetailsTrue1()
                    'lblerr.Visible = True
                    'Label1.Text = "Tumefika kwa Login***** " & LoginReply
                    'Exit Sub
                    Select Case LoginReply
                        Case "CannAccess"
                            'check if password has expired
                            Dim datedifference As Long = 0

                            If MyLastPasswordReset.ToString = "" OrElse IsNothing(MyLastPasswordReset) = True Then MyLastPasswordReset = Date.Now

                            datedifference = DateDiff(DateInterval.Day, CDate(MyLastPasswordReset.ToString), Date.Today)

                            'AUDIT TRAIL-------
                            Dim audit As New DataManagement
                            audit.AddAdminAuditTrail(Session("UserName").ToString, "Login", "Successful Login.", _
                            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                            '----END AUDIT TRAIL-----
                            ''Response.Redirect("Welcome.aspx")

                            If datedifference < 30 Then
                                Session("Loginattempts") = 0
                                If Session("Mypageurl") = "" Then
                                    Dim strUA As String = Request.UserAgent.Trim().ToLower()
                                    Dim isMobile As Boolean = False
                                    If strUA.Contains("ipod") OrElse strUA.Contains("iphone") OrElse strUA.Contains("ipad") OrElse strUA.Contains("ipod touch") Then isMobile = True
                                    If strUA.Contains("android") Then isMobile = True
                                    If strUA.Contains("opera mobi") Then isMobile = True
                                    If strUA.Contains("windows phone os") AndAlso strUA.Contains("iemobile") Then isMobile = True
                                    If strUA.Contains("palm") Then isMobile = True
                                    Dim MobileDevice As Boolean = Request.Browser.IsMobileDevice

                                    If isMobile = True AndAlso MobileDevice = True Then
                                        Dim Url As String = ""
                                        'Response.Redirect("Welcome.aspx")
                                        OTP()
                                    Else
                                        lblMessage.Text = "Loading..."
                                        OTP()


                                        'Response.Redirect("Welcome.aspx")
                                    End If
                                Else
                                    Dim strUA As String = Request.UserAgent.Trim().ToLower()
                                    Dim isMobile As Boolean = False
                                    If strUA.Contains("ipod") OrElse strUA.Contains("iphone") OrElse strUA.Contains("iPad") Then isMobile = True
                                    If strUA.Contains("android") Then isMobile = True
                                    If strUA.Contains("opera mobi") Then isMobile = True
                                    If strUA.Contains("windows phone os") AndAlso strUA.Contains("iemobile") Then isMobile = True
                                    If strUA.Contains("palm") Then isMobile = True
                                    Dim MobileDevice As Boolean = Request.Browser.IsMobileDevice

                                    If isMobile = True AndAlso MobileDevice = True Then
                                        Dim Url As String = ""
                                        Response.Redirect("Welcome.aspx")
                                        'Response.Redirect(Url)
                                    Else
                                        lblMessage.Text = "Loading..."
                                        OTP()
                                        'Response.Redirect(Session("Mypageurl"))
                                    End If
                                End If
                            Else
                                Session("Loginattempts") = 0
                                Response.Redirect("ChangePass.aspx")
                            End If
                        Case "NeedActivation"
                            'AUDIT TRAIL-------
                            Dim audit As New DataManagement
                            audit.AddAdminAuditTrail(Session("UserName").ToString, "Login", "Successful Login. Needs Activation", _
                            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                            '----END AUDIT TRAIL-----
                            Session("Loginattempts") = 0

                            Response.Redirect("ChangePass.aspx")
                        Case "ClientLocked"
                            'AUDIT TRAIL-------
                            Dim audit As New DataManagement
                            audit.AddAdminAuditTrail(Session("UserName").ToString, "Login", "Unsuccessful Login. User Locked", _
                            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                            '----END AUDIT TRAIL-----
                            lblMessage.Text = "Account Locked. Kindly contact the system administrator."
                        Case "ClientNeedsApproval"
                            'AUDIT TRAIL-------
                            Dim audit As New DataManagement
                            audit.AddAdminAuditTrail(Session("UserName").ToString, "Login", "Unsuccessful Login. Needs Approval", _
                            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                            '----END AUDIT TRAIL-----
                            lblMessage.Text = "Approval required. Kindly contact the system administrator."

                        Case "InvalidDetails 1"
                            lblMessage.Text = "Access Credentials Supplied are Incorrect!"
                            If Val(Session("Loginattempts")) > 2 Then
                                lblMessage.Text = "3 wrong Login attempts! Account Has been Locked. Kindly contact the system admin"
                                ''Exit Sub
                                'deactivate account so that user changes password on next logon
                                MyDBAction.DBAction("Update employees set Activated = 0 where EmployeeID = " & Session("MyEmployeeID") & "", DataManagement.DBActionType.Update)

                                'MyDBAction.DeactivateSignatory(Val(Session("MyEmployeeID")))

                                'Lock Account
                                MyDBAction.DBAction("Update employees set EmployeeLocked = 1 where EmployeeID = " & Session("MyEmployeeID") & "", DataManagement.DBActionType.Update)

                                txtpassword.Focus()

                                'AUDIT TRAIL-------
                                Dim audit As New DataManagement
                                audit.AddAdminAuditTrail(MyUsername, "Login", "Unsuccessful Login to Document Management System. 3 wrong login attempts. Account locked.", _
                                Request.Url.ToString, "", "")
                                '----END AUDIT TRAIL-----

                                'Response.Redirect("Logout.aspx")
                            Else
                                lblMessage.Text = "Invalid Login Details!"

                                Me.SetFocus(txtpassword)

                                ''Exit Sub
                                'AUDIT TRAIL-------
                                Dim audit As New DataManagement
                                audit.AddAdminAuditTrail(MyUsername, "Login", "Unsuccessful Login to  Management System. Invalid Login Details.", _
                                Request.Url.ToString, "", "")
                                '----END AUDIT TRAIL-----
                            End If
                        Case "InvalidDetails 2"
                            lblMessage.Text = "Not a Member of this Domain!"
                        Case "InvalidDetails 3"
                            lblMessage.Text = "Not a Member of this Domain!"
                        Case "InvalidDetails"

                        Case Else
                            lblMessage.Text = "This service is currently unavailable. Kindly contact IT Department."

                            'AUDIT TRAIL-------
                            Dim audit As New DataManagement
                            audit.AddAdminAuditTrail(MyUsername, "Login", "Unsuccessful Login to Document Management System. Could not connect to database server.", _
                            Request.Url.ToString, "", "")
                            '----END AUDIT TRAIL-----

                    End Select

                End If

            Catch ex As Exception
                MyDBAction.DoLogs("Class==Login.vb : Private Sub btnLogin_Click" & " : Error : " & ex.Message)
            End Try

        Catch ex As Exception
            ' MyDBAction.DoLogs("Class==Login.vb : Private Sub btnLogin_Click" & " : Error : " & ex.Message)
            lblMessage.Text = "Error Loading " & ex.Message
        End Try



    End Sub
    Private Function GenerateOtp(Optional length As Integer = 6) As String
        Dim random As New Random()
        Dim otp As String = ""
        For i As Integer = 1 To length
            otp &= random.Next(0, 10).ToString()
        Next
        Return otp
    End Function
    Private Sub DisallowMultipleLoginSessions(ByVal EmployeeID As Integer)
        Dim MySqlAction As String = ""
        Dim MyDBAction As New DataManagement

        Try
            MySqlAction = "UPDATE employees SET ActiveSession = 1 WHERE EmployeeID = " & EmployeeID & ""
            MyDBAction.DBAction(MySqlAction, DataManagement.DBActionType.Update)

        Catch ex As Exception
            MyDBAction.DoLogs("Class==Login.vb : Private Sub DisallowMultipleLoginSessions" & " : Error : " & ex.Message)
        End Try

    End Sub

    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    Private Sub InsertRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Insert)

    End Sub

    'Public Shared Sub SwitchToMobileSite(ByVal CurrentPage As Page)
    '    If SiteType = "Mobile Site" Then
    '        'If HttpContext.Current.Request.Browser.IsMobileDevice Then
    '        'Swap MasterPage to Mobile
    '        CurrentPage.MasterPageFile = "~/Master_mobile.master"
    '        'End If
    '    End If
    'End Sub

    'Public Shared Sub MobileSiteDefault(ByVal CurrentPage As Page)
    '    If HttpContext.Current.Request.Browser.IsMobileDevice Then
    '        'Swap MasterPage to Mobile
    '        CurrentPage.MasterPageFile = "~/M_Welcome.aspx"
    '    End If
    'End Sub



    Protected Sub lnkpass_Click(sender As Object, e As System.EventArgs) Handles lnkpass.Click
        Dim CryptographyFactory As New DocManagementSecurity.CryptoFactory()
        Dim Cryptographer As DocManagementSecurity.ICrypto = CryptographyFactory.MakeCryptographer(EnctryptionAlgorith)
        Dim MySecurePass As New DocManagementSecurity
        Dim MyPasswordEnc As String = ""
        Dim MyRandPassword As String = MySecurePass.GenRandomPassword.ToLower
        Dim MyEncryptedPass As String = Cryptographer.Encrypt(MyRandPassword)
        Dim my_sql As String = ""

        'Dim beforeEnc As String = txtPass.Text
        'Dim MyEncPass As String = Cryptographer.Encrypt(beforeEnc)
        Dim mydecrypw As String = ""

        Dim MailSent As Boolean = False
        Dim approved As Boolean = False

        Session("EmpEmail") = ""
        Session("EmpUsername") = ""
        Session("EmployeeName") = ""
        Session("empPass") = ""

        Try

            ''If AuthorizedToApprove(HiddenField1.Value) = True Then
            '==============checking credentials of user trying to resend password=============================================
            If Session("MyEmployeeID") = Nothing Then
                my_sql = "select EmployeeId from employees where username = '" & Trim(txtusername.Text) & "'"
                my_reader = TryCast(my_object.DBAction(my_sql, DataManagement.DBActionType.DataReader), SqlDataReader)
                If my_reader.HasRows Then
                    my_reader.Read()
                    Session("MyEmployeeID") = IIf(IsDBNull(my_reader("EmployeeId")) = True, "", my_reader("EmployeeId").ToString.Trim)
                Else

                    lblMessage.Text = "Enter your username!"
                    Exit Sub
                End If
            End If

            '==========fetching details of employee to be sent for password =============================================
            my_sql = "select EmployeeName,Approved,Email,UserName from employees where employeeID = '" & Session("MyEmployeeID") & "' "
            my_reader = my_object.DBAction(my_sql, DataManagement.DBActionType.DataReader)

            If my_reader.HasRows Then
                my_reader.Read()
                approved = IIf(IsDBNull(my_reader("Approved")), False, my_reader("Approved"))
                Session("EmpEmail") = IIf(IsDBNull(my_reader("Email")) = True, "", my_reader("Email").ToString.Trim)
                Session("EmpUsername") = IIf(IsDBNull(my_reader("UserName")) = True, "", my_reader("UserName").ToString.Trim)
                Session("EmployeeName") = IIf(IsDBNull(my_reader("EmployeeName")) = True, "", my_reader("EmployeeName").ToString.Trim)

                my_sql = "update employees set password = '" & MyEncryptedPass & "', Activated = 0,EMPLOYEELOCKED=0 where employeeID = '" & Session("MyEmployeeID") & "'"
                my_object.DBAction(my_sql, DataManagement.DBActionType.Update)

                ''Session("empPass") = Cryptographer.Decrypt(MyEncryptedPass) --Unnecessary step since we already have the decrypted pwd.
                Session("empPass") = MyRandPassword

            End If

            If approved = False Then
                lblMessage.Text = "User requires approval"
                'Panel3.Visible = True
                Exit Sub
            Else
                If Session("EmpEmail") <> "" Then
                    MailSent = SendLoginDetails()

                    If MailSent = True Then
                        lblMessage.Text = "A Random Password has been generated and sent to the user's Email Address."
                        'Panel3.Visible = True
                        'AUDIT TRAIL-------
                        Dim audit As New DataManagement
                        audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "Password for user " & Session("username") & " successfully emailed to: " & Session("Fullname") & ".", _
                        Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                        '----END AUDIT TRAIL-----

                    Else
                        lblMessage.Text = "Failure sending mail. Contact the system administrator."
                        'Panel3.Visible = True
                        'AUDIT TRAIL-------
                        Dim audit As New DataManagement
                        audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "There a was a problem resending password for user " & Session("Fullname") & " to: " & Session("username") & ".", _
                        Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                        '----END AUDIT TRAIL-----
                    End If

                ElseIf Session("EmpEmail") = "" Then

                    lblMessage.Text = "No email address found in the user's records."
                    'Panel3.Visible = True
                    'AUDIT TRAIL-------
                    Dim audit As New DataManagement
                    audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "There a was a problem resending password for user " & Session("Fullname") & " to: " & Session("username") & " - No valid email address found on user's records.", _
                    Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                    '----END AUDIT TRAIL-----
                Else

                    lblMessage.Text = "A problem occured while sending the E-mail."
                    'Panel3.Visible = True
                    'AUDIT TRAIL-------
                    Dim audit As New DataManagement
                    audit.AddAdminAuditTrail(Session("UserName").ToString, "ReSend Back Office User Password", "There a was a problem resending password for user " & Session("Fullname") & " to: " & Session("Fullname") & ".", _
                    Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                    '----END AUDIT TRAIL-----
                End If
            End If

            ''Else
            ''Label4.Text = "Failure resetting password: Creator/Modifier cannot resend password."
            ''End If

        Catch ex As Exception

        End Try
    End Sub
    Private Function SendLoginDetails() As Boolean



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
            lblMessage.Text = "New Password generated and send to users email address!"

            'Panel3.Visible = True
        Catch ex As Exception
            MailSent = False
        End Try

        Return MailSent
    End Function
    
    Public Shared Function GenerateRandomOTP(ByVal iOTPLength As Integer, ByVal saAllowedCharacters As String()) As String
        'Dim sOTP As String = String.Empty
        Dim sTempChars As String = String.Empty
        Dim rand As Random = New Random()

        For i As Integer = 0 To iOTPLength - 1
            Dim p As Integer = rand.[Next](0, saAllowedCharacters.Length)
            sTempChars = saAllowedCharacters(rand.[Next](0, saAllowedCharacters.Length))
            sOTP += sTempChars
        Next

        Return sOTP
    End Function
    Private Sub SendOtpToEmail(recipientEmail As String, otp As String)
        Try
            LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail1").Trim()
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName1").Trim()
            LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject1").Trim()
            EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
            EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername1").Trim()
            EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword1").Trim()
            MessageSubject = "MIS OTP TOKEN"  ' System.Configuration.ConfigurationManager.AppSettings("Subject").Trim()

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
            strHTML = strHTML.Append("Your MIS OPT Code is: <em><span style='color: red'>")
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
            Panel1.Visible = True


        Catch ex As Exception
            ' Optional: Show/log the error
            lblMessage.Text = "Failed to send email. " & ex.Message
        End Try
    End Sub
    Protected Sub btnSubmitOtp_Click(ByVal sender As Object, ByVal e As EventArgs) Handles btnSubmitOtp.Click, btnCancel.Click
        lblMessage.Text = ""
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

            'Response.Redirect("Login.aspx")
            lblMessage.Text = "Invalid OTP. Please try again."
            txtOtp.Text = ""
        End If
    End Sub
 

    Protected Sub btnCancel_Click(sender As Object, e As System.EventArgs) Handles btnCancel.Click
        Response.Redirect("Login.aspx")
    End Sub
End Class
