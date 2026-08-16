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
    Dim AB As Integer
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing


                'loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try


            If cbosearch.SelectedValue = "P" Then
                SqlAction = "select Policy_Code,Proposer, Risk_Rating,Description from [AAR_RISK_DB].[dbo].[TBL_MIS_CLIENT_RISK_RATING] C WITH (NOLOCK)  INNER JOIN   [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_REASON] R WITH (NOLOCK) ON C.Reason=R.Reason_Code  WHERE  C.Proposer like '%" & txtsearch.Text & "%' "
            ElseIf cbosearch.SelectedValue = "P_1" Then
                SqlAction = "select Policy_Code,Proposer, Risk_Rating,Description from [AAR_RISK_DB].[dbo].[TBL_MIS_CLIENT_RISK_RATING] C WITH (NOLOCK)  INNER JOIN   [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_REASON] R WITH (NOLOCK) ON C.Reason=R.Reason_Code  WHERE  C.Policy_Code ='" & txtsearch.Text & "' "
            End If
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_AML.DataSource = MyDatable
                GD_AML.DataBind()

                MyDatable = Nothing
            Else
                GD_AML.DataSource = MyDatable
                GD_AML.DataBind()
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Protected Sub btnsearch0_Click(sender As Object, e As EventArgs) Handles btnsearch0.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String = ""
        Try

            Session("EXCEL") = "TO EXCEL"

            SqlAction = "select Policy_Code,Proposer,CoverType,System, Risk_Rating,Description from [AAR_RISK_DB].[dbo].[TBL_MIS_CLIENT_RISK_RATING] C WITH (NOLOCK)  INNER JOIN   [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_REASON] R WITH (NOLOCK) ON C.Reason=R.Reason_Code"
            Reportname = "Risk_Rating "
            Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
End Class
