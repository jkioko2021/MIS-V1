Imports DocManage
Imports System.Data.SqlClient
Imports System.Diagnostics
Imports System.Data
Imports Telerik.Web.UI
Partial Class MasterPage
    Inherits System.Web.UI.MasterPage
    Public ActionIsRefresh As Boolean = False
    Public Logout As Boolean = False
    Dim MyDbAction As New DataManagement
    Public Shared SiteType As String
    Private DBAppName As String = "", DBClient As String = "", DBVersion As String = ""
    Private CryptographyFactory As New CryptoFactory()
    Private MyEncDec As ICrypto = CryptographyFactory.MakeCryptographer()

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        Dim PageAccessed As String = ""
        Dim MyDBAction As New DataManagement
        Dim SqlAction As String = ""
        Session("DTFROM") = Nothing
        Session("DTTO") = Nothing
        Try
            'LoadLicence(MyDBAction.GetSqlDate(Date.Today))

        

            'Create SiteType Cookie on first load event
            If IsNothing(Response.Cookies("SiteType").Value) Then
                Response.Cookies("SiteType").Value = "Desktop Site"
                SiteType = Response.Cookies("SiteType").Value
            End If

        Catch ex As Exception

        End Try

        'The application should log of if no postback or autopostback is done within the duration taken for a session to expire
        Response.AddHeader("Refresh", Convert.ToString(Session.Timeout * 60) + 5)

        PageAccessed = Page.ToString.Trim
        PageAccessed = Mid(PageAccessed, 5)
        PageAccessed = PageAccessed.Replace("_aspx", ".aspx")

        If IsNothing(Session("FullNames")) Then
            Server.Transfer("login.aspx")
        End If
        If IsNothing(Session("FullNames")) Then
            Response.Redirect("login.aspx")
        Else

        End If
        Label1.Text = Session("FullNames")
        Label2.Text = Date.Today.ToString("dd-MMMM-yyyy")
        Label4.Text = Now.ToString("hh:mm:ss")

        'James 05-Jan-2024; License Count Down Notification
        Label5.Visible = False
       
      
        ' ''''
        'If LoadLicence(MyDBAction.GetSqlDate(Date.Today)) Then

        If CanAccessPage(PageAccessed) = True Then
            If Not Page.IsPostBack Then
                DisplayMenuItems1()

                SqlAction = "SELECT  MIN([DATE_FROM])DATE_FROM,MIN([DATE_TO])DATE_TO FROM SALES.[dbo].[TBL_MIS_PROD_MONTHS] WHERE [MONTH_CLOSED] =0"
                Dim MyDatable As New Data.DataTable
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

                If MyDatable.Rows.Count > 0 Then
                    Session("DTFROM") = CDate(MyDatable.Rows(0).Item("DATE_FROM")).ToString("yyyy-MM-dd")
                    Session("DTTO") = CDate(MyDatable.Rows(0).Item("DATE_TO")).ToString("yyyy-MM-dd") ' MyDatable.Rows(0).Item("DATE_TO").ToString()
                End If

                SqlAction = "SELECT [Staff_On_Call],[Staff_Mobile] FROM [CRM].[dbo].[TBL_MIS_CRM_STAFF_ON_CALL] WHERE [Date]=CONVERT(char(10), GetDate(),126)"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    Label6.Text = MyDatable.Rows(0).Item("Staff_On_Call").ToString()
                    Label7.Text = MyDatable.Rows(0).Item("Staff_Mobile").ToString()
                End If

                If Not Session("LicenseExpiryDays") Is Nothing Then
                    Label5.Visible = True
                    Label5.Text = "" ''"License will expire in " & Session("LicenseExpiryDays") & " Days "
                End If

            End If

        Else
            Response.Redirect("")
        End If


        ''''''
        'Else
        'Label5.Visible = True
        'Label5.Text = "License Expired!"
        'End If
    End Sub


    'Private Sub ExpandChildNode(Optional ByVal mySelectedNode As String = "")
    '    Dim MyNode As New TreeNode
    '    Dim MySelNode As String = TreeView2.SelectedValue



    '    If MySelNode <> "" Then
    '        Session("NodeName") = MySelNode

    '        For Each MyNode In TreeView2.Nodes
    '            If MyNode.Value = Session("NodeName") Then
    '                If MyNode.ChildNodes.Count > 0 Then
    '                    TreeView2.CollapseAll()
    '                    MyNode.Expand()
    '                End If

    '            End If
    '        Next
    '    Else
    '        TreeView2.CollapseAll()
    '        For Each MyNode In TreeView2.Nodes
    '            If MyNode.Value = Session("NodeName") Then
    '                If MyNode.ChildNodes.Count > 0 Then

    '                    MyNode.Expand()
    '                End If

    '            End If
    '        Next
    '    End If
    'End Sub

    'Protected Sub cmdCaptureMenu_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles cmdCaptureMenu.Click
    '    CaptureMenu()
    'End Sub
    'Private Sub CaptureMenu()
    '    Dim MyMainMenu As String = ""
    '    Dim MySubMenu As String = ""
    '    Dim MyItemURL As String = ""

    '    Dim SqlAction As String = "DELETE from MenuAccessData where MenuType ='ADMIN'"

    '    Dim MyNode As New TreeNode
    '    Dim MyChildNode As New TreeNode

    '    Dim MyDBAction As New DataManagement
    '    MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.Insert)

    '    For Each MyNode In TreeView2.Nodes
    '        MyMainMenu = MyNode.Value.ToString
    '        Debug.Print(MyMainMenu)
    '        If MyNode.ChildNodes.Count > 0 Then

    '            For Each MyChildNode In MyNode.ChildNodes
    '                MySubMenu = MyChildNode.Value.ToString
    '                MyItemURL = MyChildNode.NavigateUrl.ToString

    '                If MyMainMenu = "Client User Management" Then
    '                    Dim Mstr As String = MyMainMenu
    '                End If
    '                If MyMainMenu = MySubMenu Then
    '                Else
    '                    InsertToMenuTable(MyMainMenu, MySubMenu, MyItemURL)
    '                End If
    '            Next
    '        Else

    '        End If
    '    Next
    'End Sub
    'Private Sub InsertToMenuTable(ByVal strMainMenuName As String, ByVal strSubMenuName As String, ByVal strItemURL As String)
    '    Dim SqlInsert As String = ""
    '    Dim MyDBAction As New DataManagement

    '    SqlInsert = "INSERT INTO MenuAccessData(PageURL,MainMenuName,SubMenuName,MenuType)values('" & strItemURL & "','" & strMainMenuName & "','" & strSubMenuName & "','ADMIN')"

    '    MyDBAction.DBAction(SqlInsert, DataManagement.DBActionType.Insert)
    'End Sub
    'Private Sub DisplayMenuItems()
    '    Dim MyMenuName As String = ""
    '    Dim MnuCount As Int16 = 0
    '    Dim j As Int16

    '    TreeView1.Nodes.Clear()

    '    Dim MyDataTable As New DataTable
    '    Dim sqlAction As String = "Select Distinct MainMenuName from vw_MenuAcessProfile where PROFILEID = " & Session("MyProfileID") & " and CANACCESS =1" ' ORDER BY MENUORDER ASC"

    '    Dim MySmsObject As New DataManagement
    '    MyDataTable = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataTable), DataTable)

    '    If MyDataTable.Rows.Count > 0 Then

    '        MnuCount = MyDataTable.Rows.Count
    '        For j = 0 To MyDataTable.Rows.Count - 1
    '            MyMenuName = MyDataTable.Rows(j).Item("MainMenuName").ToString
    '            'MyMenuName = UppercaseLetters(MyMenuName)
    '            Dim MyMainNode As New TreeNode
    '            MyMainNode.Value = MyMenuName
    '            MyMainNode.Text = MyMenuName
    '            AddChildNode(MyMenuName.ToString, MyMainNode)
    '            TreeView1.Nodes.Add(MyMainNode)

    '            ''MyMainNode.ImageUrl = "~/TreeLineImages/gabicon.gif"
    '            MyMainNode.ImageUrl = "~/Images/new images/GABNET ICONS/gabicon.gif" ''Get_image_url("MainMenu") '"~/Images/gabicon.gif"

    '        Next
    '        ''Dim tn As New TreeNode
    '        ''tn.Text = "Change Password"
    '        ''tn.NavigateUrl = "~/changepassword.aspx"
    '        ''tn.ImageUrl = "~/TreeLineImages/gabicon.gif"
    '        ''tn.Value = "Change Password"
    '        ''TreeView2.Nodes.Add(tn)

    '        MyMenuName = "Change Password"
    '        Dim MyURL As String = "~/changepassword.aspx"

    '        Dim MySubNode As New TreeNode
    '        MySubNode.Value = MyMenuName
    '        MySubNode.Text = MyMenuName
    '        MySubNode.NavigateUrl = MyURL
    '        MySubNode.ImageUrl = "~/Images/new images/GABNET ICONS/SubMenus.jpg" ''Get_image_url("SubMenu") '"~/Images/gabicon.gif"

    '        TreeView1.Nodes.Add(MySubNode)

    '        'Dim tn1 As New TreeNode
    '        'tn1.Text = "Log Out"
    '        'tn1.NavigateUrl = "~/logout.aspx"
    '        'tn1.Value = "Log Out"
    '        'TreeView2.Nodes.Add(tn1)
    '    End If

    '    TreeView1.CollapseAll()

    'End Sub
    'Private Function CreateTestTable() As DataTable
    '    '    Dim table As New DataTable()
    '    '    table.Columns.Add("ID")
    '    '    table.Columns.Add("ParentID")
    '    '    table.Columns.Add("Text")
    '    '    table.Columns.Add("URL")
    '    '    table.Columns.Add("Tooltip")
    '    '    table.Rows.Add(New String() {"1", Nothing, "root 1", "root1.aspx", "root 1 tooltip"})
    '    '    table.Rows.Add(New String() {"2", Nothing, "root 2", "root2.aspx", "root 1 tooltip"})
    '    '    table.Rows.Add(New String() {"3", "1", "child 1.1", "child11.aspx", "child 1.1 tooltip"})
    '    '    table.Rows.Add(New String() {"4", "1", "child 1.2", "child12.aspx", "child 1.2 tooltip"})
    '    '    table.Rows.Add(New String() {"5", "1", "child 1.3", "child13.aspx", "child 1.3 tooltip"})
    '    '    table.Rows.Add(New String() {"6", "2", "child 1.3.1", "child131.aspx", "child 1.3.1 tooltip"})
    '    '    table.Rows.Add(New String() {"7", "2", "child 1.3.2", "child132.aspx", "child 1.3.2 tooltip"})
    '    '    table.Rows.Add(New String() {"8", "2", "child 1.3.3", "child133.aspx", "child 1.3.3 tooltip"})



    '    '    Return table
    '    'End Function
    Private Sub DisplayMenuItems1()
        Try
            Dim MyMenuName As String = ""
            Dim MnuCount As Int16 = 0
            'Dim j As Int16
            RadMenu1.Items.Clear()

            Dim MyDataTable As New DataTable
            Dim sqlrpt As String
            Dim MySmsObject As New DataManagement
            Dim MyTable As New DataTable
            Dim sqlquery As String = "Select Distinct MainMenuName from menuaccess where PROFILEID = " & Session("MyProfileID") & " and CANACCESS =1" ' ORDER BY MENUORDER ASC"
            MyTable = TryCast(MySmsObject.DBAction(sqlquery, DataManagement.DBActionType.DataTable), DataTable)

            For i As Integer = 0 To MyTable.Rows.Count - 1
                Dim MainMenu As New RadMenuItem
                MainMenu.Text = MyTable.Rows(i).Item(0).ToString
                RadMenu1.Items.Add(MainMenu)

                Dim sqlAction As String = "Select MenuAccessID,MainMenuName,SubMenuName,PageUrl from menuaccess where PROFILEID = " & Session("MyProfileID") & " and CANACCESS =1 and MainMenuName='" & MyTable.Rows(i).Item(0).ToString & "' order by mainmenuname,menuorder"

                MyDataTable = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataTable), DataTable)
                If MyDataTable.Rows.Count > 0 Then
                    For s As Integer = 0 To MyDataTable.Rows.Count - 1
                        Dim MenuItem As New RadMenuItem
                        MenuItem.Text = MyDataTable.Rows(s).Item(2).ToString
                        MenuItem.NavigateUrl = MyDataTable.Rows(s).Item(3).ToString
                        MainMenu.Items.Add(MenuItem)

                    Next

                End If

            Next



            Dim ChgPassMenu As New RadMenuItem
            ChgPassMenu.Text = "Change Password"
            ChgPassMenu.NavigateUrl = "~/ChangePass.aspx"
            RadMenu1.Items.Add(ChgPassMenu)

            Dim LogoutMenu As New RadMenuItem
            LogoutMenu.Text = "Log Out"
            LogoutMenu.NavigateUrl = "~/logout.aspx"
            RadMenu1.Items.Add(LogoutMenu)

        Catch ex As Exception

        End Try


    End Sub

    ''Public Function Get_image_url(ByVal node_name As String) As String
    ''    Dim url As String = ""
    ''    Dim SQLAction As String = ""
    ''    Try

    ''        SQLAction = "Select * from Image_url where Menu_Name = '" & node_name & "'"
    ''        Dim MySmsObject As New DataManagement
    ''        Dim MyReader As SqlDataReader = TryCast(MySmsObject.DBAction(SQLAction, DataManagement.DBActionType.DataReader), SqlDataReader)
    ''        If MyReader.HasRows Then
    ''            MyReader.Read()
    ''            url = IIf(IsDBNull(MyReader("Image_url")) = True, "~/Images/new images/GABNET ICONS/gabicon.gif", MyReader("Image_url").ToString.Trim)
    ''        End If
    ''        MyReader.Close()
    ''    Catch ex As Exception

    ''    Finally

    ''    End Try
    ''    Return url
    ''End Function

    'Private Sub AddChildNode(ByVal strMainMenu As String, ByRef MyNode As TreeNode)

    '    Dim MyMenuName As String = ""
    '    Dim MyURL As String = ""
    '    Dim MnuCount As Int16 = 0
    '    Dim j As Int16

    '    Dim MyDataTable As New DataTable
    '    Dim sqlAction As String = "Select SubMenuName,PageURL,MENUORDER from vw_MenuAcessProfile where MainMenuName = '" & strMainMenu & "' and PROFILEID = " & Session("MyProfileID") & " and CANACCESS =1 ORDER BY MENUORDER ASC"

    '    Dim MySmsObject As New DataManagement
    '    MyDataTable = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataTable), DataTable)

    '    If MyDataTable.Rows.Count > 0 Then
    '        MnuCount = MyDataTable.Rows.Count
    '        For j = 0 To MyDataTable.Rows.Count - 1
    '            MyMenuName = MyDataTable.Rows(j).Item("SubMenuName").ToString
    '            MyURL = MyDataTable.Rows(j).Item("PageURL").ToString
    '            Dim MySubNode As New TreeNode
    '            MySubNode.Value = MyMenuName
    '            MySubNode.Text = MyMenuName
    '            MySubNode.NavigateUrl = MyURL
    '            ''MySubNode.ImageUrl = "~/TreeLineImages/gabicon.gif" '"~/images/blt.jpg"
    '            MySubNode.ImageUrl = "~/Images/new images/GABNET ICONS/SubMenus.jpg" ''Get_image_url("SubMenu") '"~/Images/gabicon.gif"

    '            MyNode.ChildNodes.Add(MySubNode)
    '        Next
    '        Dim pageurl As String = Session("PageURL")
    '        Session("Reportname") = MyURL
    '    End If
    'End Sub
    Private Function CanAccessPage(ByVal strPageAccessed As String) As Boolean
        Try
            Dim CanAccessFlag As Int16 = 0
            Dim CanAccess As Boolean = False

            If strPageAccessed = "welcome.aspx" Then
                Return True : Exit Function
            End If

            If strPageAccessed = "changepassword.aspx" Then
                Return True : Exit Function
            End If

            If strPageAccessed = "changepwdsuccess.aspx" Then
                Return True : Exit Function
            End If

            strPageAccessed = "~/" & strPageAccessed

            Dim SqlAction As String = "SELECT CANACCESS from menuaccess where PROFILEID =" & Session("MyProfileID") & " and PAGEURL = '" & strPageAccessed & "'"


            Dim MyDBAction As New DataManagement
            CanAccessFlag = MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.Scalar)

            CanAccess = CBool(CanAccessFlag)

            Return CanAccess

        Catch ex As Exception
            Return False
            MyDbAction.DoLogs("Class==MasterPage.vb : Private Sub CanAccessPage" & " : Error : " & ex.Message)
        End Try
    End Function
    'Protected Sub LinkButton1_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles LinkButton1.Click
    '    ''--B4 killing the session, unflag ActiveSession
    '    KillActiveSession(Session("MyEmployeeID"))

    '    Session.Abandon()
    '    Response.Redirect("Login.aspx")
    'End Sub

    'Protected Sub Button1_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles Button1.Click
    '    'Response.Redirect("chequeRequest1.aspx")
    '    CaptureMenu()


    'End Sub



    '' ''Automatic refresh of accounts at specified times
    ''Private Sub refreshAccounts()
    ''    'Dim MyDataManagement As New DataManagement

    ''    'DeleteRecord("Delete from ACCOUNTS_TEMP where ADDEDBY= '" & Session("FullNames") & "'")

    ''    ActionIsRefresh = True

    ''    RetrieveAcctDetails(True)

    ''    'RefreshLinkedAccts()

    ''    'saveAccountsToOurDB()
    ''End Sub

    ''Private Sub DeleteRecord(ByVal sqlAction As String)
    ''    Dim MySmsObject As New DataManagement
    ''    MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

    ''    '
    ''End Sub

    ''Private Sub RetrieveAcctDetails(Optional ByVal IsAcctRefresh As Boolean = False, Optional ByVal MyLinkedCIF As String = "")
    ''    Dim mySqlAction As String = ""
    ''    Dim SqlAction As String = ""
    ''    Dim MyDBAction As New DataManagement
    ''    Dim MAcctBaseNum As String = ""
    ''    Dim MAcctNum As String = ""
    ''    Dim MyAcctTitle As String = ""
    ''    Dim MyAccType As String = ""
    ''    Dim MyCurrencyCode As String = ""
    ''    Dim MyCurrencyName As String = ""
    ''    Dim InsertAction As String = ""
    ''    Dim MyDate1 As DateTime = Date.Today
    ''    Dim Mydate2 As String = Format(MyDate1, "dd-MMM-yyyy")
    ''    Dim K As Int16 = 0
    ''    Dim MyDatable As New DataTable
    ''    Dim MyArrayList As New ArrayList


    ''    'Retrieve all base numbers from the db and put them in an array
    ''    SqlAction = "select ACCTBASENO from CLIENTDETAILS "
    ''    MyDatable = TryCast(MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.DataTable), DataTable)

    ''    If MyDatable.Rows.Count > 0 Then
    ''        For K = 0 To MyDatable.Rows.Count - 1
    ''            MyArrayList.Add(MyDatable.Rows(K).Item("ACCTBASENO").ToString)
    ''        Next
    ''    End If

    ''    K = 0
    ''    'Dim MyAccountNumber As String = ""
    ''    If MyArrayList.Count > 0 Then
    ''        For K = 0 To MyArrayList.Count - 1
    ''            MAcctBaseNum = MyArrayList.Item(K).ToString()

    ''            'Retrieve all accounts so long as they are not closed i.e. Acct_cls_flg = 'N'
    ''            If MyLinkedCIF <> "" Then
    ''                mySqlAction = "select * from gam where cust_id = '" & MyLinkedCIF & "' and Acct_cls_flg = 'N'"
    ''            Else
    ''                mySqlAction = "select * from gam where cust_id = '" & MAcctBaseNum & "' and Acct_cls_flg = 'N'"
    ''            End If

    ''            Dim MyODBCReader As Data.OracleClient.OracleDataReader
    ''            MyODBCReader = TryCast(MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.OracleDataReader), Data.OracleClient.OracleDataReader)
    ''            If MyODBCReader.HasRows Then
    ''                Do While MyODBCReader.Read()

    ''                    MAcctNum = MyODBCReader("Foracid").ToString.Trim

    ''                    'Dont clear existing accounts otherwise all mandates will disappear - Njiraini
    ''                    If IsAcctRefresh = True AndAlso AccountExist(MAcctNum) = False Then

    ''                        mySqlAction = "DELETE  from  ACCOUNTS where ACCTNUMBER = '" & MAcctNum & "'"
    ''                        MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.Delete)


    ''                        MyAcctTitle = MyODBCReader("Acct_Name").ToString.Trim

    ''                        MyAccType = AcctTypeFull(MyODBCReader("Schm_Type")).Trim

    ''                        'MyAccType = MyODBCReader("Schm_Type").ToString.Trim

    ''                        'If MyAccType.Trim <> "" Then
    ''                        MyCurrencyCode = MyODBCReader("Acct_crncy_code").ToString.Trim '  MaCurrency(MyODBCReader("ccy").ToString.Trim).Trim
    ''                        'MyCurrencyName = MaCurrency(MyODBCReader("ccy").ToString.Trim).Trim
    ''                        MyCurrencyName = MyCurrencyCode


    ''                        InsertAction = "INSERT INTO ACCOUNTS_TEMP(BASENUMBER,ACCTNUMBER,ACCTNAME,ACCTTYPE,CURRENCY,CURRENCYCODE,APPROVED,DATEADDED,LASTUPDATED,ADDEDBY,ACTIVE,NewlyRefreshed) values( '" & MAcctBaseNum & "','" & MAcctNum & "','" & MyAcctTitle & "','" & MyAccType & "','" & MyCurrencyName & "','" & MyCurrencyCode & "', 0,'" & Mydate2 & "','" & Mydate2 & "','" & Session("FullNames") & "',0,1)"

    ''                        SaveAcctDetails(InsertAction)
    ''                        'End If

    ''                    Else

    ''                        MyAcctTitle = MyODBCReader("Acct_Name").ToString.Trim

    ''                        MyAccType = AcctTypeFull(MyODBCReader("Schm_Type")).Trim

    ''                        'MyAccType = MyODBCReader("Schm_Type").ToString.Trim

    ''                        'If MyAccType.Trim <> "" Then
    ''                        MyCurrencyCode = MyODBCReader("Acct_crncy_code").ToString.Trim '  MaCurrency(MyODBCReader("ccy").ToString.Trim).Trim
    ''                        'MyCurrencyName = MaCurrency(MyODBCReader("ccy").ToString.Trim).Trim
    ''                        MyCurrencyName = MyCurrencyCode

    ''                        InsertAction = "INSERT INTO ACCOUNTS_TEMP(BASENUMBER,ACCTNUMBER,ACCTNAME,ACCTTYPE,CURRENCY,CURRENCYCODE,APPROVED,DATEADDED,LASTUPDATED,ADDEDBY,ACTIVE,NewlyRefreshed) values( '" & MAcctBaseNum & "','" & MAcctNum & "','" & MyAcctTitle & "','" & MyAccType & "','" & MyCurrencyName & "','" & MyCurrencyCode & "', 0,'" & Mydate2 & "','" & Mydate2 & "','" & Session("FullNames") & "',0,0)"

    ''                        SaveAcctDetails(InsertAction)
    ''                        'End If
    ''                    End If



    ''                    ' End If

    ''                Loop

    ''            End If

    ''            MyODBCReader.Close()

    ''        Next
    ''        saveAccountsToOurDB()

    ''    End If


    ''        End Sub


    ''Private Function AccountExist(ByVal strAccountNumber As String) As Boolean
    ''    Dim AcctExist As Boolean = False

    ''    Dim SqlAction As String = ""
    ''    Dim MyAccountNumber As String

    ''    Dim MyDBAction As New DataManagement

    ''    SqlAction = "Select ACCTNUMBER from  ACCOUNTS where ACCTNUMBER = '" & strAccountNumber & "'"
    ''    MyAccountNumber = MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.Scalar)

    ''    If IsNothing(MyAccountNumber) Then
    ''        MyAccountNumber = ""
    ''    End If

    ''    If MyAccountNumber.ToString.Trim <> "" Then
    ''        AcctExist = True
    ''    Else
    ''        AcctExist = False
    ''    End If

    ''    Return AcctExist
    ''End Function


    ' ''This function gets the account types in full - Mercy
    ' ''These details should preferably be parameterized in the web config file
    ''Private Function AcctTypeFull(ByVal SchemeType As String) As String

    ''    Dim MyAccType As String = ""

    ''    Select Case SchemeType
    ''        Case "ODA"
    ''            MyAccType = "Current" : Return MyAccType : Exit Function

    ''        Case "SBA"
    ''            MyAccType = "Savings" : Return MyAccType : Exit Function

    ''        Case "BIA"
    ''            MyAccType = "Inland Bills" : Return MyAccType : Exit Function

    ''        Case "LAA"
    ''            MyAccType = "Loans" : Return MyAccType : Exit Function

    ''        Case "TDA"
    ''            MyAccType = "Term Deposits" : Return MyAccType : Exit Function
    ''    End Select

    ''    Return MyAccType
    ''End Function

    ''Private Sub SaveAcctDetails(ByVal strInsert As String)
    ''    Try
    ''        Dim MyDBAction As New DataManagement
    ''        MyDBAction.DBAction(strInsert, DataManagement.DBActionType.Insert)
    ''    Catch ex As Exception

    ''    End Try

    ''End Sub

    ''Private Sub saveAccountsToOurDB()
    ''    'Check if the account exists to avoid saving same account twice
    ''    Dim MAcctNum As String = ""
    ''    Dim MyDatable As New DataTable
    ''    Dim MyArrayList As New ArrayList
    ''    Dim MyDBAction As New DataManagement
    ''    Dim mySqlAction As String = ""
    ''    Dim K As Int16 = 0
    ''    mySqlAction = "select * from ACCOUNTS_TEMP "


    ''    MyDatable = TryCast(MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.DataTable), DataTable)

    ''    If MyDatable.Rows.Count > 0 Then
    ''        For K = 0 To MyDatable.Rows.Count - 1
    ''            MyArrayList.Add(MyDatable.Rows(K).Item("ACCTNUMBER").ToString)
    ''        Next
    ''    End If

    ''    K = 0

    ''    If MyArrayList.Count > 0 Then
    ''        For K = 0 To MyArrayList.Count - 1
    ''            MAcctNum = MyArrayList.Item(K).ToString()
    ''            If AccountExist(MAcctNum) = False Then
    ''                SaveNewAccts(MAcctNum)
    ''            End If
    ''        Next

    ''    End If

    ''    DeleteRecord("Delete from ACCOUNTS_TEMP where  ADDEDBY = '" & Session("FullNames") & "'")


    ''    'ShowAccountDetails("SELECT * from ACCOUNTS where  CLIENTID =" & HiddenField1.Value.Trim & " order by acctname,ACCTNUMBER")

    ''    'ShowAccountTempDetails("Select * FROM ACCOUNTS_TEMP where ADDEDBY = '" & Session("FullNames") & "'")

    ''    'Session("AcctDetais") = "SELECT * from ACCOUNTS where  CLIENTID =" & HiddenField1.Value.Trim & ""


    ''    'ShowAcctList()

    ''End Sub

    '' ''Function to save only new accounts on refreshing of accounts
    ''Private Sub SaveNewAccts(ByVal MAcctNum As String)
    ''    Dim MyDBAction As New DataManagement
    ''    Dim mySqlAction As String = ""
    ''    'mySqlAction = "Update ACCOUNTS_TEMP set CLIENTID =" & HiddenField1.Value.Trim & " where ADDEDBY = '" & Session("FullNames") & "'"
    ''    'MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.Update)

    ''    mySqlAction = "INSERT INTO ACCOUNTS(CLIENTID,BASENUMBER,ACCTNUMBER,ACCTNAME,ACCTTYPE,CURRENCY,CURRENCYCODE,APPROVED,DATEADDED,LASTUPDATED,ADDEDBY,ACTIVE) Select CLIENTID,BASENUMBER,ACCTNUMBER,ACCTNAME,ACCTTYPE,CURRENCY,CURRENCYCODE,APPROVED,DATEADDED,LASTUPDATED,ADDEDBY,ACTIVE from  ACCOUNTS_TEMP where ADDEDBY = '" & Session("FullNames") & "' and ACCTNUMBER = '" & MAcctNum & "' and (ACCTTYPE = 'Current' or ACCTTYPE = 'Savings') "

    ''    MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.Insert)

    ''End Sub

    'Protected Sub Timer1_Tick(ByVal sender As Object, ByVal e As System.EventArgs) Handles Timer1.Tick
    '    'checkTime()
    'End Sub

    'Private Sub checkTime()
    '    'We want the system to refresh accounts twice per day
    '    Dim SpecifiedTime1 As DateTime = "12:00:00"
    '    Dim SpecifiedTime2 As DateTime = "00:00:00"
    '    'Dim ServerTime As Date = Now.TimeOfDay.ToString
    '    Dim MyTimeServer As DateTime = Date.Now
    '    Dim ServerTime As String = MyTimeServer.ToString("hh:mm:ss")

    '    If (ServerTime = SpecifiedTime1 Or ServerTime = SpecifiedTime2) Then
    '        refreshAccounts()
    '    End If

    'End Sub

    'Protected Sub Timer1_Tick(ByVal sender As Object, ByVal e As System.EventArgs) Handles Timer1.Tick
    '    If Logout = True Then
    '        ''--B4 killing the session, unflag ActiveSession
    '        KillActiveSession(Session("MyEmployeeID"))

    '        Session.Abandon()
    '        Response.Redirect("Login.aspx")


    '    End If

    'End Sub
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
                'lblerr.Text = "License file cannot be found, contact system administrator " & WebsitePath & "\License.fin"
                Exit Function
            End If

            If DBClient.Trim.Length <= 0 Or DBAppName.Trim.Length <= 0 Or DBVersion.Trim.Length <= 0 Then
                LoadLicence = False
                'lblerr.Text = "Data License file cannot be found, contact system administrator " & WebsitePath & "\License.fin"
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
                'lblerr.Text = "The software license applied is not valid for this Client"
                Exit Function
            End If

            If Version.ToLower.Trim <> DBVersion.ToLower.Trim Then
                LoadLicence = False
                'lblerr.Text = "The software version applied is not valid for this Client"

                Exit Function
            End If

            If AppName.ToLower.Trim <> DBAppName.ToLower.Trim Then
                LoadLicence = False
                'lblerr.Text = "The software license applied is not valid for this application"
                Exit Function
            End If

            If StartDate > EndDate Then ' if start date is greater than enddate
                LoadLicence = False
                'lblerr.Text = "The software license applied is not valid"
                Exit Function
            End If

            If SystemDate < StartDate Then ' if systemdate is less than startdate
                LoadLicence = False
                'lblerr.Text = "The system has detected that you have Changed the Machine date and will terminate"
                Exit Function
            End If

            If SystemDate > EndDate Then ' if systemdate is greater than enddate
                LoadLicence = False
                'lblerr.Text = "License has Expired please contact the system administrator"
                Exit Function
            End If
            Session("LicenseExpiryDays") = Nothing
            Session("LoadLicence") = LoadLicence
            REM warn user if days diff of the license and the server date is less or equal to one month
            Dim DaysToExpiry As Integer = 0
            If LoadLicence = True Then
                DaysToExpiry = DateDiff(DateInterval.Day, SystemDate, EndDate)

                If DaysToExpiry < 30 Then ' if days between the systemdate and the enddate is less than 30 days
                    Session("LicenseExpiryDays") = DaysToExpiry
                    'LblStatus.Text = "License will expire in " & DaysToExpiry & " Days "
                    'lblerr.Text = "License will expire in " & Session("LicenseExpiryDays") & " Days "
                End If


            End If

        Catch ex As Exception
            LoadLicence = False
            'lblerr.Text = "Could not Resolve License Information. Please contact system Administrator"
            Exit Function
        Finally

        End Try
        Return LoadLicence
    End Function

    Protected Sub RadMenu1_ItemCreated(sender As Object, e As Telerik.Web.UI.RadMenuEventArgs) Handles RadMenu1.ItemCreated
        Session("Reportname") = RadMenu1.OnClientItemClicked
    End Sub

End Class

