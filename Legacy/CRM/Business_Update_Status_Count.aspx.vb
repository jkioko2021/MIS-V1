
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
    Dim empcode As String
    Dim MyDatatable As DataTable : Dim Str As String

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        Try
            If Not IsPostBack Then

                empcode = ""
                Session("EXCEL") = Nothing
                Session("Allocated_to") = Nothing
                Load_Grid()
                'dtfrom.DbSelectedDate = Date.Now()
                'dtto.DbSelectedDate = Date.Now()

            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Public Sub Load_Grid()
        Try

            GD_M_M.DataSource = Nothing
            GD_M_M.DataBind()
            
            GDRM_1.DataSource = Nothing
            GDRM_1.DataBind()

            SqlAction = "SELECT [Business_Type],SUM([Total_Registered])[Total_Registered],SUM([Not_Forwarded])[Not_Forwarded],SUM([Returned_NotForwarded])[Returned_NotForwarded],SUM([Not_Allocated])[Not_Allocated],SUM([Medical_UW])[Medical_UW],SUM([Declined])[Declined],SUM([Pricing])[Pricing],SUM([Waiting_Update])[Waiting_Update],SUM([Waiting_Payment])[Waiting_Payment],SUM([Not_Receipted])[Not_Receipted],SUM([Receipted])[Receipted]  FROM [CRM].[dbo].TBL_MIS_CRM_TRACKING_SUMMARY_PER_MONTH GROUP BY   [Business_Type]  "
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_M_M.DataSource = MyDatable
                GD_M_M.DataBind()
            Else
                GD_M_M.DataSource = Nothing
                GD_M_M.DataBind()
            End If

            SqlAction = "SELECT  [Allocated_to], SUM([Total_Registered])[Total_Registered],SUM([Not_Forwarded])[Not_Forwarded],SUM([Returned_NotForwarded])[Returned_NotForwarded],SUM([Not_Allocated])[Not_Allocated],SUM([Medical_UW])[Medical_UW],SUM([Declined])[Declined],SUM([Pricing])[Pricing],SUM([Waiting_Update])[Waiting_Update],SUM([Waiting_Payment])[Waiting_Payment],SUM([Not_Receipted])[Not_Receipted],SUM([Receipted])[Receipted]  FROM   [CRM].[dbo].[TBL_MIS_CRM_TRACKING_SUMMARY_ALLOCATED] GROUP BY  [Entry_Yr] ,[Allocated_to]  "
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_M_1.DataSource = MyDatable
                GD_M_1.DataBind()
            Else
                GD_M_1.DataSource = Nothing
                GD_M_1.DataBind()
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Protected Sub GD_M_1_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_M_1.SelectedIndexChanged
        Try
            GDRM_1.DataSource = Nothing
            GDRM_1.DataBind()
            GDRM_2.DataSource = Nothing
            GDRM_2.DataBind()
            Session("Allocated_to") = Nothing

            Session("Allocated_to") = (DirectCast(GD_M_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("Allocated_to").ToString()
            SqlAction = "SELECT Business_type , SUM([Total_Registered])[Total_Registered],SUM([Not_Forwarded])[Not_Forwarded],SUM([Returned_NotForwarded])[Returned_NotForwarded],SUM([Not_Allocated])[Not_Allocated],SUM([Medical_UW])[Medical_UW],SUM([Declined])[Declined],SUM([Pricing])[Pricing],SUM([Waiting_Update])[Waiting_Update],SUM([Waiting_Payment])[Waiting_Payment],SUM([Not_Receipted])[Not_Receipted],SUM([Receipted])[Receipted]  FROM   [CRM].[dbo].[TBL_MIS_CRM_TRACKING_SUMMARY_ALLOCATED]  WHERE [Allocated_to] ='" & Session("Allocated_to") & "'   GROUP BY  [Entry_Yr] ,Business_type   "
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDRM_1.DataSource = MyDatable
                GDRM_1.DataBind()
            Else
                GDRM_1.DataSource = Nothing
                GDRM_1.DataBind()
            End If

            SqlAction = "SELECT Mon ,Entry_Mon, SUM([Total_Registered])[Total_Registered],SUM([Not_Forwarded])[Not_Forwarded],SUM([Returned_NotForwarded])[Returned_NotForwarded],SUM([Not_Allocated])[Not_Allocated],SUM([Medical_UW])[Medical_UW],SUM([Declined])[Declined],SUM([Pricing])[Pricing],SUM([Waiting_Update])[Waiting_Update],SUM([Waiting_Payment])[Waiting_Payment],SUM([Not_Receipted])[Not_Receipted],SUM([Receipted])[Receipted]  FROM   [CRM].[dbo].[TBL_MIS_CRM_TRACKING_SUMMARY_ALLOCATED]  WHERE [Allocated_to] ='" & Session("Allocated_to") & "'   GROUP BY  [Entry_Yr] ,Mon ,Entry_Mon  having SUM([Waiting_Update])<>0  order by Mon"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDRM_2.DataSource = MyDatable
                GDRM_2.DataBind()
            Else
                GDRM_2.DataSource = Nothing
                GDRM_2.DataBind()
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub



  

    Protected Sub GDRM_2_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDRM_2.SelectedIndexChanged
        GDRM_1.DataSource = Nothing
        GDRM_1.DataBind()
        
        HiddenField1.Value = ""

        HiddenField1.Value = (DirectCast(GDRM_2.SelectedItems(0), GridDataItem)).GetDataKeyValue("Entry_Mon").ToString()
        SqlAction = "SELECT Business_type , SUM([Total_Registered])[Total_Registered],SUM([Not_Forwarded])[Not_Forwarded],SUM([Returned_NotForwarded])[Returned_NotForwarded],SUM([Not_Allocated])[Not_Allocated],SUM([Medical_UW])[Medical_UW],SUM([Declined])[Declined],SUM([Pricing])[Pricing],SUM([Waiting_Update])[Waiting_Update],SUM([Waiting_Payment])[Waiting_Payment],SUM([Not_Receipted])[Not_Receipted],SUM([Receipted])[Receipted]  FROM   [CRM].[dbo].[TBL_MIS_CRM_TRACKING_SUMMARY_ALLOCATED]  WHERE [Allocated_to] ='" & Session("Allocated_to") & "'  and Entry_Mon='" & HiddenField1.Value & "'   GROUP BY  [Entry_Yr] ,Business_type  having SUM([Waiting_Update])<>0 "
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDRM_1.DataSource = MyDatable
            GDRM_1.DataBind()
        Else
            GDRM_1.DataSource = Nothing
            GDRM_1.DataBind()
        End If
 
    End Sub
End Class
