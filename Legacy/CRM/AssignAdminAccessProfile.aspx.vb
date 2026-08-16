Imports DocManage
Imports System.Data.SqlClient
Imports System.Data

Partial Class _Default
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not Page.IsPostBack Then
            DisplayMenuItems()
            ShowProfiles()

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Page Access", "Accessed Page for 'Admin Access Profiles'", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----
        End If
    End Sub

    Private Sub DisplayMenuItems()
        Try
            Dim MyMenuName As String = ""
            Dim MnuCount As Int16 = 0
            Dim j As Int16

            TreeView1.Nodes.Clear()

            With TreeView1
                '.BackColor = Drawing.SystemColors.
                .BorderColor = Drawing.Color.White
                .BorderStyle = BorderStyle.Solid
                .BorderWidth = Unit.Pixel(1)
                .Font.Size = FontUnit.Point(8)
                .ForeColor = Drawing.Color.Black
                .ParentNodeStyle.BackColor = Drawing.Color.Yellow
                .ParentNodeStyle.ForeColor = Drawing.Color.Black
                .RootNodeStyle.BackColor = Drawing.Color.WhiteSmoke
                .RootNodeStyle.BorderColor = Drawing.Color.Black
                .RootNodeStyle.BorderStyle = BorderStyle.Solid
                .RootNodeStyle.BorderWidth = Unit.Point(1)
                .RootNodeStyle.Font.Size = FontUnit.Point(10)

            End With

            Dim MyDataTable As New Data.DataTable
            Dim sqlAction As String = "Select Distinct MainMenuName from MenuAccessData where MenuType = 'ADMIN'"

            Dim MySmsObject As New DataManagement
            MyDataTable = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDataTable.Rows.Count > 0 Then
                MnuCount = MyDataTable.Rows.Count
                For j = 0 To MyDataTable.Rows.Count - 1
                    MyMenuName = MyDataTable.Rows(j).Item("MainMenuName").ToString
                    Dim MyMainNode As New TreeNode
                    MyMainNode.Value = MyMenuName
                    MyMainNode.Text = MyMenuName.ToUpper.ToString
                    AddChildNode(MyMenuName.ToString, MyMainNode)
                    TreeView1.Nodes.Add(MyMainNode)

                Next

            End If

            TreeView1.CollapseAll()
        Catch ex As Exception
            MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
        End Try


    End Sub
    Private Sub AddChildNode(ByVal strMainMenu As String, ByRef MyNode As TreeNode)
        Try
            Dim MyMenuName As String = ""
            Dim MyURL As String = ""
            Dim MnuCount As Int16 = 0
            Dim j As Int16

            Dim MyDataTable As New Data.DataTable
            Dim sqlAction As String = "Select SubMenuName,PageURL from MenuAccessData where MainMenuName = '" & strMainMenu & "' and MenuType = 'ADMIN'"

            Dim MySmsObject As New DataManagement
            MyDataTable = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDataTable.Rows.Count > 0 Then
                MnuCount = MyDataTable.Rows.Count
                For j = 0 To MyDataTable.Rows.Count - 1
                    MyMenuName = MyDataTable.Rows(j).Item("SubMenuName").ToString
                    MyURL = MyDataTable.Rows(j).Item("PageURL").ToString

                    Dim MySubNode As New TreeNode
                    MySubNode.Value = MyMenuName
                    MySubNode.Text = MyMenuName
                    MySubNode.NavigateUrl = MyURL


                    MyNode.ChildNodes.Add(MySubNode)
                Next

            End If
        Catch ex As Exception
            MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub AddChildNode()" & " : Error : " & ex.Message)
        End Try

    End Sub
    Private Sub ShowProfiles()
        Try
            Dim MyDataTable As New Data.DataTable
            Dim MyDBAction As New DataManagement
            MyDataTable = TryCast(MyDBAction.DBAction("Select PROFILEID,PROFILENAME FROM PROFILE WHERE PROFILETYPE = 'ADMIN'", DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDataTable IsNot Nothing Then
                With DropDownProfile
                    .Items.Clear()
                    .DataSource = MyDataTable
                    .DataTextField = MyDataTable.Columns("PROFILENAME").ToString
                    .DataValueField = MyDataTable.Columns("PROFILEID").ToString
                    .DataBind()
                    .Items.Add("")
                    .SelectedValue = ""
                End With
                MyDataTable = Nothing
            End If

        Catch ex As Exception
            MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub ShowProfiles()" & " : Error : " & ex.Message)
        End Try

    End Sub

    Protected Sub CmdSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdSave.Click
        If Not Page.IsValid Then Exit Sub
        SaveAccessProfile()
        Label1.Text = "Saved Successfully!!"

        'AUDIT TRAIL-------
        Try
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Admin Access Profile", "Successful Assigning of Menu Access for profile:" & _
            DropDownProfile.SelectedItem.Text.ToString & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----
        Catch ex As Exception
            MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Protected Sub CmdSave_Click" & " : Error : " & ex.Message)
        End Try

    End Sub

    Private Sub SaveAccessProfile()
        Try
            Dim MyMainMenu As String = ""
            Dim MySubMenu As String = ""
            Dim MyItemURL As String = ""
            Dim MyMenuType As String = ""
            Dim MenuSelected As Int16 = 0
            MyMenuType = "ADMIN"

            Dim SqlAction As String = "DELETE from MenuAccess where ProfileID =" & DropDownProfile.SelectedValue & ""

            Dim MyNode As New TreeNode
            Dim MyChildNode As New TreeNode

            Dim MyDBAction As New DataManagement
            MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.Insert)

            For Each MyNode In TreeView1.Nodes
                MyMainMenu = MyNode.Value.ToString
                If MyNode.ChildNodes.Count > 0 Then

                    For Each MyChildNode In MyNode.ChildNodes
                        MySubMenu = MyChildNode.Value.ToString
                        MyItemURL = MyChildNode.NavigateUrl.ToString
                        If MyChildNode.Checked = True Then
                            MenuSelected = 1
                        Else
                            MenuSelected = 0
                        End If

                        If MyMainMenu = MySubMenu Then
                        Else
                            Dim MenuOrder As Integer = 0
                            SqlAction = "Select * from MenuAccessData where SubMenuName='" & MySubMenu & "'"
                            Dim Mytable As DataTable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                            If Mytable.Rows.Count > 0 Then
                                MenuOrder = Mytable.Rows(0).Item("MenuOrder").ToString
                            End If
                            InsertToMenuTable(MyMainMenu, MySubMenu, MyItemURL, MenuOrder, MenuSelected, MyMenuType)
                        End If

                    Next

                Else

                End If

            Next
        Catch ex As Exception
            MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub SaveAccessProfile" & " : Error : " & ex.Message)
        End Try

    End Sub

    Private Sub InsertToMenuTable(ByVal strMainMenuName As String, ByVal strSubMenuName As String, ByVal strItemURL As String, ByVal MenuOrder As String, ByVal AccessMenu As Int16, ByVal strMenuType As String)
        Try
            Dim SqlInsert As String = ""
            Dim MyDBAction As New DataManagement
            'Dim Mydate As DateTime
            Dim Mydate As String

            If HiddenField1.Value.ToString <> "" Then
                Mydate = Format(HiddenField1.Value, "dd-MMM-yyyy")
            Else
                Mydate = Format(Date.Today, "dd-MMM-yyyy")
            End If

            Dim CurrentDate As String = Format(Date.Today, "dd-MMM-yyyy")
            ''Dim DateStr As String = CurrentDate.Day & "-" & CurrentDate.Month & "-" & CurrentDate.Year

            SqlInsert = "INSERT INTO MenuAccess(PageURL,MainMenuName,SubMenuName,MenuType,MenuOrder,ProfileID,CANACCESS,DATEADDED,LASTUPDATED)values('" & strItemURL & "','" & strMainMenuName & "','" & strSubMenuName & "','" & strMenuType & "','" & MenuOrder & "'," & DropDownProfile.SelectedValue & "," & AccessMenu & ",'" & Mydate & "','" & CurrentDate & "')"

            MyDBAction.DBAction(SqlInsert, DataManagement.DBActionType.Insert)
        Catch ex As Exception
            MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub InsertToMenuTable" & " : Error : " & ex.Message)
        End Try

    End Sub

    Protected Sub DropDownProfile_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs)
        Label1.Text = ""

        If DropDownProfile.SelectedValue.ToString <> "" Then
            showAccessProfile()
        End If
    End Sub

    Private Sub showAccessProfile()
        Dim MyMainMenu As String = ""
        Dim MySubMenu As String = ""
        Dim MyItemURL As String = ""
        Dim MyMenuType As String = ""
        Dim MenuSelected As Boolean = False




        Dim MyNode As New TreeNode
        Dim MyChildNode As New TreeNode


        For Each MyNode In TreeView1.Nodes
            MyMainMenu = MyNode.Value.ToString
            MyNode.Checked = False
            If MyNode.ChildNodes.Count > 0 Then

                For Each MyChildNode In MyNode.ChildNodes
                    MySubMenu = MyChildNode.Value.ToString
                    MyItemURL = MyChildNode.NavigateUrl.ToString

                    If MyMainMenu = MySubMenu Then
                    Else
                        Dim SqlAction As String = "Select CANACCESS from MenuAccess where MainMenuName ='" & MyMainMenu & "' and SubMenuName ='" & MySubMenu & "' and profileID = '" & DropDownProfile.SelectedValue & "'"

                        If CanAccessMenuItem(SqlAction) = True Then
                            MyChildNode.Checked = True
                        Else
                            MyChildNode.Checked = False
                        End If
                    End If

                Next

            Else

            End If


        Next
    End Sub
    Private Function CanAccessMenuItem(ByVal SqlAction As String) As Boolean
        Dim ProfileCanAccessMenu As Boolean = False

        Dim MyDBAction As New DataManagement
        ProfileCanAccessMenu = CBool(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.Scalar))

        Return ProfileCanAccessMenu

    End Function

    Protected Sub DropDownProfile_SelectedIndexChanged1(ByVal sender As Object, ByVal e As System.EventArgs)
        Label1.Text = ""

        If DropDownProfile.SelectedValue.ToString <> "" Then
            showAccessProfile()
        End If

        'If DropDownProfile.SelectedValue = "1" Then
        '    CmdSave.Enabled = False
        'Else
        '    CmdSave.Enabled = True
        'End If
    End Sub
    Protected Sub TreeView1_TreeNodeCheckChanged(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.TreeNodeEventArgs) Handles TreeView1.TreeNodeCheckChanged
        If e.Node.Checked = True Then
            If e.Node.ChildNodes.Count > 0 Then
                Dim MyChildNode As New TreeNode

                For Each MyChildNode In e.Node.ChildNodes

                    MyChildNode.Checked = True
                Next

            End If
        Else
            If e.Node.ChildNodes.Count > 0 Then
                Dim MyChildNode As New TreeNode

                For Each MyChildNode In e.Node.ChildNodes

                    MyChildNode.Checked = False
                Next

            End If
        End If

    End Sub
    Private Sub ExpandChildNode(Optional ByVal mySelectedNode As String = "")
        Dim MyNode As New TreeNode
        Dim MySelNode As String = TreeView1.SelectedValue



        If MySelNode <> "" Then
            Session("NodeName") = MySelNode

            For Each MyNode In TreeView1.Nodes
                If MyNode.Value = Session("NodeName") Then
                    If MyNode.ChildNodes.Count > 0 Then
                        TreeView1.CollapseAll()
                        MyNode.Expand()
                    End If

                End If
            Next
        Else
            TreeView1.CollapseAll()
            For Each MyNode In TreeView1.Nodes
                If MyNode.Value = Session("NodeName") Then
                    If MyNode.ChildNodes.Count > 0 Then

                        MyNode.Expand()
                    End If

                End If
            Next
        End If

    End Sub
    Protected Sub TreeView1_SelectedNodeChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles TreeView1.SelectedNodeChanged
        ExpandChildNode()
    End Sub

    Protected Sub TreeView1_TreeNodeExpanded(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.TreeNodeEventArgs) Handles TreeView1.TreeNodeExpanded
        Session("NodeName") = e.Node.Value

    End Sub

    Protected Sub RadButton2_Click(sender As Object, e As System.EventArgs) Handles RadButton2.Click
        Try
            Dim SqlAction As String = ""
            Dim Str As String = "" : Dim Mytable As DataTable = Nothing
            Dim Reportname As String = "User Rights List"

            SqlAction = "SELECT  [EmployeeName],[UserName],[Department],[MainMenuName],[SubMenuName],[LastLoginDate],[LASTPASSWORDRESET]  FROM [CRM].[dbo].[vw_rpt_USER_RIGHTS]"

            Session("EXCEL") = "TO EXCEL"
            Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
            'Reportname = ""
        Catch ex As Exception

        End Try
    End Sub
End Class
