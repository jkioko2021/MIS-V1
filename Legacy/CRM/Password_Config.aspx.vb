Imports System.Data
Imports DocManage.DataManagement

Imports System.Data.SqlClient

Imports Telerik.Web.UI
Imports DocManage
Imports System.IO

Imports System.Data.OleDb
Imports System.Web.Configuration
Imports Mymail
Partial Class _Default
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""
    Dim SqlAction As String = ""
    Dim MyDatatable As DataTable : Dim Str As String
    Dim MailSent As Boolean = False

    Protected Sub Page_LoadComplete(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.LoadComplete
        If Not IsPostBack Then
            
            Dim MyDatable As New Data.DataTable
            Session("DAD_5") = Nothing

            SqlAction = "SELECT [ID],[Len],[Hist],[Lock_cnt],[Is_Numeric],[Is_special],[Is_Capital],Pass_Reset  FROM [CRM].[dbo].[TBL_MIS_CRM_PASSWORD_CONF]"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDatable.Rows.Count > 0 Then
                GDSEARCH.DataSource = MyDatable
                GDSEARCH.DataBind()
                Session("DAD_5") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH.DataSource = MyDatable
                GDSEARCH.DataBind()
            End If
        End If
    End Sub

    Protected Sub GDSEARCH_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDSEARCH.NeedDataSource

    End Sub

    Protected Sub GDSEARCH_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDSEARCH.SelectedIndexChanged
        Dim ID As String = ""
        'cboprovider.SelectedValue = ""
        Dim Is_Appeal As Integer = 0
        Dim Is_SPECIAL As Integer = 0
        'cboprovider.Text = ""
        lblerr.Text = ""

        Try


            ID = (DirectCast(GDSEARCH.SelectedItems(0), GridDataItem)).GetDataKeyValue("ID").ToString()
            Dim SqlAction As String = ""

            Session("status_1") = Nothing
            SqlAction = "SELECT [ID],[Len],[Hist],[Lock_cnt],[Is_Numeric],[Is_special],[Is_Capital],Pass_Reset  FROM [CRM].[dbo].[TBL_MIS_CRM_PASSWORD_CONF] WHERE ID='" & ID & "'"
            If SqlAction <> "" Then
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If SqlAction <> "" Then
                    txthistory.Text = MyDatable.Rows(0).Item("Hist").ToString()
                    txtlengt.Text = MyDatable.Rows(0).Item("Len").ToString()
                    txtlock.Text = MyDatable.Rows(0).Item("Lock_cnt").ToString()
                    cbocap.SelectedValue = MyDatable.Rows(0).Item("Is_Capital").ToString()
                    cbonumeric.SelectedValue = MyDatable.Rows(0).Item("Is_Numeric").ToString()
                    cbospec.SelectedValue = MyDatable.Rows(0).Item("Is_special").ToString()
                    txtpass.Text = MyDatable.Rows(0).Item("Pass_Reset").ToString()
                End If

                txthistory.Enabled = False
                txtlengt.Enabled = False
                txtlock.Enabled = False
                cbocap.Enabled = False
                cbonumeric.Enabled = False
                cbospec.Enabled = False
                HiddenField1.Value = 1
                Session("DAD_5") = Nothing

            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub cmdsave_Click(sender As Object, e As System.EventArgs) Handles cmdsave.Click
        Try
            UpdateRecord("UPDATE [CRM].[dbo].[TBL_MIS_CRM_PASSWORD_CONF] SET [Len]='" & txtlengt.Text & "',[Hist]='" & txthistory.Text & "',[Lock_cnt]='" & txtlock.Text & "',[Is_Numeric]='" & cbonumeric.SelectedValue & "',[Is_special]='" & cbospec.SelectedValue & "',[Is_Capital]='" & cbocap.SelectedValue & "',PASS_RESET='" & txtpass.Text & "'")
            lblerr.Text = "Saved Successfull"
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub

    Protected Sub cmdedit_Click(sender As Object, e As System.EventArgs) Handles cmdedit.Click
        txthistory.Enabled = True
        txtlengt.Enabled = True
        txtlock.Enabled = True
        cbocap.Enabled = True
        cbonumeric.Enabled = True
        cbospec.Enabled = True
    End Sub
End Class
