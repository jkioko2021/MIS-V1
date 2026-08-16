Imports DocManage
Imports System.Data.SqlClient
Imports System.Data
Partial Class ProfilesRoles
    Inherits System.Web.UI.Page
    Dim MyDbAction As New DataManagement

    Protected Sub ProfilesRoles_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load

        If Not Page.IsPostBack Then
            ShowProfiles()
            GetAccessPages()

            Dim MyPage As String = "ProfilesRoles.aspx"
            If MyDbAction.CANADD(Session("MyProfileID"), MyPage) = True Then
                BtnSave.Enabled = True
            ElseIf MyDbAction.CANEDIT(Session("MyProfileID"), MyPage) = True Then
                BtnSave.Enabled = True
            ElseIf MyDbAction.CANREADONLY(Session("MyProfileID"), MyPage) = True Then
                BtnSave.Enabled = False
            Else
                BtnSave.Enabled = False
            End If

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Page Access", "Accessed Page for 'Profiles/User roles'", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----
        End If
    End Sub
    Private Sub ShowProfiles()
        Try
            LblInfo.Text = ""
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
            MyDbAction.DoLogs("Class==ProfilesRole.vb : Private Sub ShowProfiles()" & " : Error : " & ex.Message)
        End Try

    End Sub

    Private Sub GetAccessPages()
        Try
            Dim Str As String
            Dim Mytable As DataTable

            Str = "Select * from Menuaccess where ProfileID='" & DropDownProfile.SelectedValue & "'"
            Mytable = TryCast(MyDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)

            GridView1.DataSource = Mytable
            GridView1.DataBind()

        Catch ex As Exception
            MyDbAction.DoLogs("Class==ProfilesRole.vb : Private Sub GetAccessPages()" & " : Error : " & ex.Message)
        End Try
    End Sub

    Protected Sub DropDownProfile_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles DropDownProfile.SelectedIndexChanged
        GetAccessPages()
    End Sub

    Protected Sub GridView1_RowDataBound(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewRowEventArgs) Handles GridView1.RowDataBound
        'If (e.Row.RowType = DataControlRowType.Header) Then
        '    'adding an attribute for onclick event on the check box in the header
        '    'and passing the ClientID of the Select All checkbox
        '    DirectCast(e.Row.FindControl("ChkAddAll"), CheckBox).Attributes.Add("onclick", "javascript:SelectAll_Row('" & _
        '        DirectCast(e.Row.FindControl("ChkAddAll"), CheckBox).ClientID & "')")

        '    DirectCast(e.Row.FindControl("ChkEditAll"), CheckBox).Attributes.Add("onclick", "javascript:SelectAll_Row('" & _
        '       DirectCast(e.Row.FindControl("ChkEditAll"), CheckBox).ClientID & "')")

        '    DirectCast(e.Row.FindControl("ChkDelAll"), CheckBox).Attributes.Add("onclick", "javascript:SelectAll_Row('" & _
        '       DirectCast(e.Row.FindControl("ChkDelAll"), CheckBox).ClientID & "')")

        '    DirectCast(e.Row.FindControl("ChkReadAll"), CheckBox).Attributes.Add("onclick", "javascript:SelectAll_Row('" & _
        '       DirectCast(e.Row.FindControl("ChkReadAll"), CheckBox).ClientID & "')")
        'End If
        Dim Str As String : Dim MYTABLE As DataTable
        Dim MyID As HiddenField
        '        Dim GrdRow As GridViewRow
        Dim ChkRead, ChkAdd, ChkDelete, ChkEdit As CheckBox
        If e.Row.RowType = DataControlRowType.DataRow Then
            MyID = CType(e.Row.Cells(1).FindControl("HiddenField1"), HiddenField)
            ChkRead = CType(e.Row.Cells(4).FindControl("ChkRead"), CheckBox)
            ChkAdd = CType(e.Row.Cells(1).FindControl("ChkAdd"), CheckBox)
            ChkDelete = CType(e.Row.Cells(3).FindControl("ChkDel"), CheckBox)
            ChkEdit = CType(e.Row.Cells(2).FindControl("ChkEdit"), CheckBox)

            Str = "SELECT * FROM MENUACCESS WHERE MENUACCESSID='" & MyID.Value & "'"
            MYTABLE = TryCast(MyDbAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MYTABLE.Rows.Count > 0 Then
                ChkAdd.Checked = MYTABLE.Rows(0).Item("CanAdd")
                ChkEdit.Checked = MYTABLE.Rows(0).Item("CanEdit")
                ChkDelete.Checked = MYTABLE.Rows(0).Item("CanDelete")
                ChkRead.Checked = MYTABLE.Rows(0).Item("ReadOnly")
                If ChkAdd.Checked = True Then
                    e.Row.Cells(1).BackColor = Drawing.Color.Aqua
                Else
                    e.Row.Cells(1).BackColor = Drawing.Color.White
                End If

                If ChkEdit.Checked = True Then
                    e.Row.Cells(2).BackColor = Drawing.Color.Aqua
                Else
                    e.Row.Cells(2).BackColor = Drawing.Color.White
                End If

                If ChkDelete.Checked = True Then
                    e.Row.Cells(3).BackColor = Drawing.Color.Aqua
                Else
                    e.Row.Cells(3).BackColor = Drawing.Color.White
                End If

                If ChkRead.Checked = True Then
                    e.Row.Cells(4).BackColor = Drawing.Color.Aqua
                Else
                    e.Row.Cells(4).BackColor = Drawing.Color.White
                End If
            End If
        End If
     

    End Sub
    Public Sub CheckAcceptAll(ByVal Sender As Object, ByVal e As EventArgs)
        Dim Chkbox, ChkAll As CheckBox
        Dim GrdRow As GridViewRow
        LblInfo.Text = ""
        Try
            Chkbox = CType(Sender, CheckBox)
            'ChkAllHeader = CType(GridView1.HeaderRow.Cells(1).FindControl("ChkPendingApproveAll0"), CheckBox)
            For Each GrdRow In GridView1.Rows
                ChkAll = CType(GrdRow.Cells(1).FindControl("ChkAdd"), CheckBox)
                If Chkbox.Checked = True Then
                    ChkAll.Checked = True
                    GrdRow.Cells(1).BackColor = Drawing.Color.Aqua
                Else
                    ChkAll.Checked = False
                    GrdRow.Cells(1).BackColor = Drawing.Color.White
                End If
            Next
            'DoSameAsfillInAmounts()
        Catch ex As Exception
            MyDbAction.DoLogs("Class==profilesroles.vb : Public Sub CheckAcceptAll" & " : Error : " & ex.Message)
        End Try
    End Sub

    Public Sub CheckAcceptEdit(ByVal Sender As Object, ByVal e As EventArgs)
        Dim Chkbox, ChkAll As CheckBox
        Dim GrdRow As GridViewRow
        LblInfo.Text = ""
        Try
            Chkbox = CType(Sender, CheckBox)
            'ChkAllHeader = CType(GridView1.HeaderRow.Cells(1).FindControl("ChkPendingApproveAll0"), CheckBox)
            For Each GrdRow In GridView1.Rows
                ChkAll = CType(GrdRow.Cells(2).FindControl("ChkEdit"), CheckBox)
                If Chkbox.Checked = True Then
                    ChkAll.Checked = True
                    GrdRow.Cells(2).BackColor = Drawing.Color.Aqua
                Else
                    ChkAll.Checked = False
                    GrdRow.Cells(2).BackColor = Drawing.Color.White
                End If
            Next
            'DoSameAsfillInAmounts()
        Catch ex As Exception
            MyDbAction.DoLogs("Class==profilesroles.vb : Public Sub CheckAcceptEdit" & " : Error : " & ex.Message)
        End Try
    End Sub

    Public Sub CheckAcceptDelete(ByVal Sender As Object, ByVal e As EventArgs)
        Dim Chkbox, ChkAll As CheckBox
        Dim GrdRow As GridViewRow
        LblInfo.Text = ""
        Try
            Chkbox = CType(Sender, CheckBox)
            'ChkAllHeader = CType(GridView1.HeaderRow.Cells(1).FindControl("ChkPendingApproveAll0"), CheckBox)
            For Each GrdRow In GridView1.Rows
                ChkAll = CType(GrdRow.Cells(3).FindControl("ChkDel"), CheckBox)
                If Chkbox.Checked = True Then
                    ChkAll.Checked = True
                    GrdRow.Cells(3).BackColor = Drawing.Color.Aqua
                Else
                    ChkAll.Checked = False
                    GrdRow.Cells(3).BackColor = Drawing.Color.White
                End If
            Next
            'DoSameAsfillInAmounts()
        Catch ex As Exception
            MyDbAction.DoLogs("Class==profilesroles.vb : Public Sub CheckAcceptDelete" & " : Error : " & ex.Message)
        End Try
    End Sub

    Public Sub CheckAcceptRead(ByVal Sender As Object, ByVal e As EventArgs)
        Dim Chkbox, ChkAll As CheckBox
        Dim GrdRow As GridViewRow
        LblInfo.Text = ""
        Try
            Chkbox = CType(Sender, CheckBox)
            'ChkAllHeader = CType(GridView1.HeaderRow.Cells(1).FindControl("ChkPendingApproveAll0"), CheckBox)
            For Each GrdRow In GridView1.Rows
                ChkAll = CType(GrdRow.Cells(4).FindControl("ChkRead"), CheckBox)
                If Chkbox.Checked = True Then
                    ChkAll.Checked = True
                    GrdRow.Cells(4).BackColor = Drawing.Color.Aqua
                Else
                    ChkAll.Checked = False
                    GrdRow.Cells(4).BackColor = Drawing.Color.White
                End If
            Next
            'DoSameAsfillInAmounts()
        Catch ex As Exception
            MyDbAction.DoLogs("Class==profilesroles.vb : Public Sub CheckAcceptRead" & " : Error : " & ex.Message)
        End Try
    End Sub


    Protected Sub BtnSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles BtnSave.Click
        Try
            Dim Str As String
            Dim MyID As HiddenField
            Dim GrdRow As GridViewRow
            Dim ChkRead, ChkAdd, ChkDelete, ChkEdit As CheckBox

            For Each GrdRow In GridView1.Rows
                MyID = CType(GrdRow.Cells(1).FindControl("HiddenField1"), HiddenField)
                ChkRead = CType(GrdRow.Cells(4).FindControl("ChkRead"), CheckBox)
                ChkAdd = CType(GrdRow.Cells(1).FindControl("ChkAdd"), CheckBox)
                ChkDelete = CType(GrdRow.Cells(3).FindControl("ChkDel"), CheckBox)
                ChkEdit = CType(GrdRow.Cells(2).FindControl("ChkEdit"), CheckBox)


                Str = "Update MenuAccess Set ReadOnly='" & ChkRead.Checked & "',CanDelete='" & ChkDelete.Checked & "',CanEdit='" & ChkEdit.Checked & "',CanAdd='" & ChkAdd.Checked & "' where PROFILEID='" & DropDownProfile.SelectedValue & "' and MENUACCESSID='" & MyID.Value & "'"
                If MyDbAction.UpdateDB(Str) = True Then
                    LblInfo.Text = "Roles Saved Successfully."
                End If
            Next
        Catch ex As Exception
            LblInfo.Text = ex.Message.ToString
            MyDbAction.DoLogs("Class==profilesroles.vb : Protected Sub BtnSave_Click" & " : Error : " & ex.Message)
        End Try
    End Sub
End Class
