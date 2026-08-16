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
                Str = "select min(Period_From)Period_From,min(Period_To)Period_To from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_PERIOD] where Status='OPEN'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbofrom
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Period_From").ToString
                    .DataValueField = MyDatatable.Columns("Period_From").ToString
                    .DataBind()
                End With
                With cboto
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Period_To").ToString
                    .DataValueField = MyDatatable.Columns("Period_To").ToString
                    .DataBind()
                End With
                LOAD_DEPART(cbofrom.SelectedValue)



              
            Catch ex As Exception
                lblsubmit.Text = ex.Message
            End Try
        End If
    End Sub
 

    Public Sub LOAD_DEPART(ByVal PERIOD As String)
        SqlAction = "SELECT   DISTINCT [Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE Closed=0  AND Period_From='" & cbofrom.SelectedValue & "'"
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
            SqlAction = "SELECT Depart_Code from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] WHERE [Sign_Off]=0 and closed=0 AND Period_From='" & cbofrom.SelectedValue & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblsubmit.Text = "You must Signoff all departments"
                Exit Sub
            End If


            UpdateRecord("UPDATE [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] SET [Status]='CLOSED',[Closed]=1,[Close_date]=convert(date,GETDATE()),[Closed_By]='" & Session("username") & "'  WHERE [Period_From]='" & cbofrom.SelectedValue & "' ")
            UpdateRecord("UPDATE [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_PERIOD] SET [Status]='CLOSED' WHERE [Period_From]='" & cbofrom.SelectedValue & "' ")

            lblsubmit.Text = "Period Closed Successful"
            LOAD_DEPART(cbofrom.SelectedValue)

        Catch ex As Exception
            lblsubmit.Text = ex.Message
        End Try
    End Sub
End Class
