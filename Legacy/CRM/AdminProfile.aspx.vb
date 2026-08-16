Imports DocManage
Imports System.Data.SqlClient
Imports Telerik.Web.UI

Partial Class AdminProfile
    Inherits System.Web.UI.Page


    Protected Sub CmdSave_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles CmdSave.Click
        Dim MyProfileType As String = ""

        Try
            If Page.IsValid = False Then Exit Sub
            Dim MyDBAction As New DataManagement
            Label2.Text = ""

            MyProfileType = "ADMIN"

            If HiddenField1.Value.ToString = "" Then
                HiddenField1.Value = MyDBAction.AddProfile(txtProfileName.Text.Trim, MyProfileType, txtComments.Text.Trim)
                Label2.Text = "Record Saved Successfully"

                'AUDIT TRAIL-------
                Dim audit As New DataManagement
                audit.AddAdminAuditTrail(Session("UserName").ToString, "Add Admin Profile", "Successfully added Admin Profile:" & txtProfileName.Text.Trim & ".", _
                Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                '----END AUDIT TRAIL-----
            Else
                MyDBAction.UpdateProfile(HiddenField1.Value.ToString, txtProfileName.Text.Trim, MyProfileType, txtComments.Text.Trim)
                Label2.Text = "Record Updated Successfully"

                'AUDIT TRAIL-------
                Dim audit As New DataManagement
                audit.AddAdminAuditTrail(Session("UserName").ToString, "Update Admin Profile", "Successfully Updated Admin Profile:" & txtProfileName.Text.Trim & ".", _
                Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
                '----END AUDIT TRAIL-----
            End If

            ShowGridDetails()
        Catch ex As Exception

        End Try


    End Sub
    Private Sub ShowGridDetails()
        Dim mySqlAction As String = ""
        Dim MyDBAction As New DataManagement

        mySqlAction = "Select * from PROFILE where PROFILETYPE = 'ADMIN' "

        Dim MyDatable As New Data.DataTable
        MyDatable = TryCast(MyDBAction.DBAction(mySqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

        GDProfile.DataSource = MyDatable
        GDProfile.DataBind()
    End Sub

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not Page.IsPostBack Then
            ShowGridDetails()

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Page Access", "Accessed Page for 'Admin Profiles'", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----
        End If
    End Sub

    Protected Sub LinkButton1_Click(ByVal sender As Object, ByVal e As System.EventArgs)
        ResetDisplayed("NewRecord")
    End Sub

    Protected Sub GDProfile_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDProfile.DeleteCommand

        Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
        HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("PROFILEID").ToString()
        Try
            Session("ID") = HiddenField1.Value

            DeleteRecord("Delete from PROFILE where PROFILEID= " & HiddenField1.Value.ToString & "")

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Delete Admin Profile", "Successfully DELETED Admin - Profileid:" & HiddenField1.Value.ToString & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            HiddenField1.Value = ""
           
        Catch ex As Exception

            e.Canceled = True
        End Try

    End Sub

   


    Protected Sub GridView2_PageIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GDProfile.PageIndexChanged

    End Sub

    'Protected Sub GridView2_PageIndexChanging(ByVal sender As Object, ByVal e As System.Web.UI.WebControls.GridViewPageEventArgs) Handles GDProfile.PageIndexChanging
    '    ShowGridDetails()
    '    GDProfile.PageIndex = e.NewPageIndex
    '    GDProfile.DataBind()
    'End Sub
    'Protected Sub GDProfile_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDProfile.DeleteCommand

    '    Label2.Text = ""
    '    Dim MyDatable As New Data.DataTable
    '    Dim MyQuery As String = ""

    '    Dim DataItem As GridDataItem = GDProfile.SelectedValue(0)
    '    HiddenField1.Value = DataItem.GetDataKeyValue("PROFILEID").ToString

    '    Session("ID") = HiddenField1.Value

    '    DeleteRecord("Delete from PROFILE where PROFILEID= " & HiddenField1.Value.ToString & "")

    '    'AUDIT TRAIL-------
    '    Dim audit As New DataManagement
    '    audit.AddAdminAuditTrail(Session("UserName").ToString, "Delete Admin Profile", "Successfully DELETED Admin - Profileid:" & HiddenField1.Value.ToString & ".", _
    '    Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
    '    '----END AUDIT TRAIL-----

    '    HiddenField1.Value = ""
    'End Sub
    Protected Sub GDProfile_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GDProfile.SelectedIndexChanged
        Try

            Label2.Text = ""
            Dim MyDatable As New Data.DataTable
            Dim MyQuery As String = ""

            Dim DataItem As GridDataItem = GDProfile.SelectedItems(0)
            HiddenField1.Value = DataItem.GetDataKeyValue("PROFILEID").ToString

            Session("ID") = HiddenField1.Value


            ShowProfile("Select * from PROFILE where PROFILEID= " & HiddenField1.Value.ToString & "")

            'AUDIT TRAIL-------
            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "View Admin Profile", "Successfully viewed Admin Profile:" & txtProfileName.Text.Trim & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            '----END AUDIT TRAIL-----

            '    Case "Delete1"

            'End Select

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
   
    Private Sub ResetDisplayed(ByVal strResetType As String)
        Label2.Text = ""

        Select Case strResetType
            Case "NewRecord"
                txtProfileName.Text = ""
                txtComments.Text = ""
                HiddenField1.Value = ""



            Case "CancelRecord"
                If HiddenField1.Value <> "" Then
                    ShowProfile("Select * from PROFILE where PROFILEID= " & HiddenField1.Value.ToString & "")
                Else
                    txtProfileName.Text = ""
                    txtComments.Text = ""
                    HiddenField1.Value = ""


                End If
        End Select
    End Sub
    Private Sub ShowProfile(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        Dim MyReader As SqlDataReader = TryCast(MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.DataReader), SqlDataReader)

        If MyReader.HasRows Then
            MyReader.Read()

            txtProfileName.Text = MyReader("PROFILENAME").ToString
            txtComments.Text = MyReader("REMARKS").ToString


        End If
        MyReader.Close()
    End Sub
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

        ShowGridDetails()
    End Sub

    Protected Sub Cancel_Click(ByVal sender As Object, ByVal e As System.EventArgs)
        ResetDisplayed("CancelRecord")
    End Sub

 


    Protected Sub GDProfile_NeedDataSource(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDProfile.NeedDataSource

    End Sub


    Protected Sub GDProfile_UpdateCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDProfile.UpdateCommand
        If e.CommandName = RadGrid.UpdateCommandName Then
            If TypeOf e.Item Is GridEditFormItem Then
                Dim item As GridEditFormItem = DirectCast(e.Item, GridEditFormItem)
                Dim id As Integer = Convert.ToInt32(item.GetDataKeyValue("user_id"))
                If id <> 0 Then
                    Dim txtlastname As TextBox = DirectCast(item.FindControl("TextBox1"), TextBox)
                    Dim txtfirstname As TextBox = DirectCast(item.FindControl("TextBox5"), TextBox)

                End If
            End If
        End If
    End Sub
End Class
