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
            dtfrom.DbSelectedDate = Date.Now()
            dtto.DbSelectedDate = Date.Now()
            Session("EXCEL") = Nothing
            loadGrid()


            Str = ""
            MyDatatable = Nothing

        End If
    End Sub
    Public Sub loadGrid()
        Dim MyDatable As New Data.DataTable
        Session("DAD_5") = Nothing


        SqlAction = "SELECT [Yr],  avg(UW_Tat)UW_Tat   FROM [CRM].[dbo].[TBL_MIS_MED_UW_TAT_DET] WHERE Yr=YEAR(GETDATE()) GROUP BY [Yr] "
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

        If MyDatable.Rows.Count > 0 Then
            GDMED_UW.DataSource = MyDatable
            GDMED_UW.DataBind()
            Session("DAD_5") = MyDatable
            MyDatable = Nothing
        Else
            GDMED_UW.DataSource = MyDatable
            GDMED_UW.DataBind()
        End If

        SqlAction = "SELECT [Yr],Mon, avg(UW_Tat)UW_Tat  FROM [CRM].[dbo].[TBL_MIS_MED_UW_TAT_DET] WHERE Yr=YEAR(GETDATE()) GROUP BY [Yr],Mon "
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDMED_UW_1.DataSource = MyDatable
            GDMED_UW_1.DataBind()
            Session("DAD_5") = MyDatable
            MyDatable = Nothing
        Else
            GDMED_UW_1.DataSource = MyDatable
            GDMED_UW_1.DataBind()
        End If

      
    End Sub

    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Try

            SqlAction = "SELECT [Yr],  avg(UW_Tat)UW_Tat   FROM [CRM].[dbo].[TBL_MIS_MED_UW_TAT_DET] WHERE Yr=YEAR(GETDATE()) and Mon between '" & Month(dtfrom.DbSelectedDate) & "' and '" & Month(dtto.DbSelectedDate) & "' GROUP BY [Yr],Mon "
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDatable.Rows.Count > 0 Then
                GDMED_UW.DataSource = MyDatable
                GDMED_UW.DataBind()
                Session("DAD_5") = MyDatable
                MyDatable = Nothing
            Else
                GDMED_UW.DataSource = MyDatable
                GDMED_UW.DataBind()
            End If

            SqlAction = "SELECT [Yr],Mon, avg(UW_Tat)UW_Tat  FROM [CRM].[dbo].[TBL_MIS_MED_UW_TAT_DET] WHERE Yr=YEAR(GETDATE()) and Mon between '" & Month(dtfrom.DbSelectedDate) & "' and '" & Month(dtto.DbSelectedDate) & "' GROUP BY [Yr],Mon"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDMED_UW_1.DataSource = MyDatable
                GDMED_UW_1.DataBind()
                Session("DAD_5") = MyDatable
                MyDatable = Nothing
            Else
                GDMED_UW_1.DataSource = MyDatable
                GDMED_UW_1.DataBind()
            End If



        Catch ex As Exception

        End Try
    End Sub

    Protected Sub RadButton3_Click(sender As Object, e As System.EventArgs) Handles RadButton3.Click
        Try
            Dim Str As String = "" : Dim Mytable As DataTable = Nothing
            Dim Reportname As String = "Medical UW-TAT"

            Session("EXCEL") = "TO EXCEL"
            'Str = "SELECT File_no,Forwad_by,Forward_Dt,Med_uw_Date,datediff(day,convert(date,Forward_Dt),convert(date,Med_UW_Date))UW_Tat FROM  [dbo].TBL_MIS_CRM_MED_UW  WHERE Med_UW_Date is not null and Forward_Dt BETWEEN '" & CDate(dtfrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtto.SelectedDate).ToString("yyyy-MM-dd") & "'"
            Str = "SELECT U.File_no,B.Business_Type,B.Client_type, U.Forwad_by,convert(date,U.Forward_Dt)Forward_Dt,U.Med_uw_Date,datediff(day,convert(date,U.Forward_Dt),convert(date,U.Med_UW_Date))UW_Tat FROM  [dbo].TBL_MIS_CRM_MED_UW U INNER JOIN [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] B ON U.File_no=B.file_no WHERE U.Med_UW_Date is not null and U.Forward_Dt BETWEEN '" & CDate(dtfrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtto.SelectedDate).ToString("yyyy-MM-dd") & "' ORDER BY U.Forward_Dt"
            Mytable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            'Mytable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing

            System.Threading.Thread.Sleep(5000)
        Catch ex As Exception

        End Try
    End Sub
End Class
