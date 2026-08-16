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
    Dim emp_code As String = ""
    Dim Department As String = ""
    Dim MyDatatable As DataTable : Dim Str As String
    Dim AB As Integer
    Dim MailSent As Boolean = False

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            Try
                Str = "select emp_code,employeename from crm.dbo.employees where deleted=0 order by employeename"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbochamp
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("employeename").ToString
                    .DataValueField = MyDatatable.Columns("emp_code").ToString
                    .DataBind()
                End With

                Str = "select emp_code,employeename from crm.dbo.employees where deleted=0 order by employeename"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboowner
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("employeename").ToString
                    .DataValueField = MyDatatable.Columns("emp_code").ToString
                    .DataBind()
                End With

               

                LOAD_DEPART()

            Catch ex As Exception
                lblsubmit.Text = ex.Message
            End Try
        End If
    End Sub


    Public Sub LOAD_DEPART()
        SqlAction = "select Depart_Code,Department, Champion, Owner_Name from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_CHAMPS]"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDDEPART.DataSource = MyDatable
            GDDEPART.DataBind()
            Session("DEP_01") = MyDatable
            MyDatable = Nothing
        Else
            GDDEPART.DataSource = Nothing
            GDDEPART.DataBind()
        End If
    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        Try
            If cbochamp.SelectedValue = "" Then
                lblsubmit.Text = "Select Champion"
                Exit Sub
            End If
            If cboowner.SelectedValue = "" Then
                lblsubmit.Text = "Select Owner"
                Exit Sub
            End If

            If lblchamp.Text = "" Or lblown.Text = "" Then
                lblsubmit.Text = "Email Is Missing"
                Exit Sub
            End If

            'UPDATE [dbo].[TBL_MIS_RISK_CHAMPS] SET emp_code= ,Champion_name= ,Email= 

            UpdateRecord("UPDATE  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_CHAMPS] SET emp_code='" & cbochamp.SelectedValue & "' ,Champion_name='" & cbochamp.Text & "' ,Email='" & lblchamp.Text & "' where department='" & lbldepart.Text & "'")
            UpdateRecord("UPDATE  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OWNER] SET owner_code='" & lblCODE.Text & "' ,Owner_Name='" & cboowner.Text & "' ,Email='" & lblown.Text & "',MIS_CODE='" & cboowner.SelectedValue & "' where department='" & lbldepart.Text & "'")
            UpdateRecord("update  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] set Risk_Owner='" & lblCODE.Text & "',Champion='" & cbochamp.SelectedValue & "' where Depart_Code='" & lbldepart.Text & "'")

            lblsubmit.Text = "Risk Champion & Owner Updated Successfull!"
            lbldepart.Text = ""
            LOAD_DEPART()

        Catch ex As Exception
            lblsubmit.Text = ex.Message
        End Try
    End Sub
 

    Protected Sub cbochamp_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cbochamp.SelectedIndexChanged
        Str = "select email from crm.dbo.employees where emp_code='" & cbochamp.SelectedValue & "'"
        MyDatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
        If MyDatable.Rows.Count > 0 Then
            lblchamp.Text = MyDatable.Rows(0).Item("email").ToString()
        End If
    End Sub

    Protected Sub cboowner_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboowner.SelectedIndexChanged
        Str = "select email from crm.dbo.employees where emp_code='" & cboowner.SelectedValue & "'"
        MyDatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
        If MyDatable.Rows.Count > 0 Then
            lblown.Text = MyDatable.Rows(0).Item("email").ToString()
        End If
    End Sub

 

    Protected Sub GDDEPART_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDDEPART.SelectedIndexChanged
        Try
            Dim own As String
            cboowner.SelectedValue = ""
            cbochamp.SelectedValue = ""
            lbldepart.Text = (DirectCast(GDDEPART.SelectedItems(0), GridDataItem)).GetDataKeyValue("Depart_Code").ToString()

            Str = "select Depart_Code,Department,Emp_code,Champion,MIS_CODE ,owner_code,Owner_Name from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_CHAMPS] where depart_code='" & lbldepart.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatable.Rows.Count > 0 Then
                'cbochamp.SelectedValue = MyDatable.Rows(0).Item("Emp_code").ToString()

                'cboowner.SelectedValue = MyDatable.Rows(0).Item("MIS_CODE").ToString()
                lblCODE.Text = MyDatable.Rows(0).Item("owner_code").ToString()
            End If



        Catch ex As Exception

        End Try
    End Sub
End Class
