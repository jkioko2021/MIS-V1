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

                dtfrom.DbSelectedDate = Date.Now()
                dtto.DbSelectedDate = Date.Now()
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()

        SqlAction = "SELECT   [Allocated_to],sum([RETURNED])[RETURNED],sum([SUBMITTED])[SUBMITTED],sum([ALLOCATED])[ALLOCATED],sum([AWAITING_RECEIPT])[AWAITING_RECEIPT],sum([AWAITING_POLICY])[AWAITING_POLICY],sum([POLICY GENERATED])[POLICY GENERATED],sum([FILED])FILED FROM [CRM].[dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_GI] GROUP BY [Allocated_to] "
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDTracking_0.DataSource = MyDatable
            GDTracking_0.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GDTracking_0.DataSource = Nothing
            GDTracking_0.DataBind()
        End If
    End Sub

    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable

        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        Try
            'Notes
            SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WHERE  File_No ='" & STR & "'  AND ACTIVE=1 ORDER BY Note_id DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
                MyDatable = Nothing
            Else
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub


    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            HiddenField1.Value = 1
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],Allocated_to,Allocated_to,eOx_Invoice_No FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()

                loadGrid(FILE_NO.Text)
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
            GDTracking_0.DataSource = Nothing
            GDTracking_0.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            SqlAction = "SELECT   [Allocated_to],sum([RETURNED])[RETURNED],sum([SUBMITTED])[SUBMITTED],sum([ALLOCATED])[ALLOCATED],sum([AWAITING_RECEIPT])[AWAITING_RECEIPT],sum([AWAITING_POLICY])[AWAITING_POLICY],sum([POLICY GENERATED])[POLICY GENERATED],sum([FILED])FILED FROM [CRM].[dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_GI] WHERE   Forward_Date Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' GROUP BY Allocated_to"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDTracking_0.DataSource = MyDatable
                GDTracking_0.DataBind()
                Session("DAD_T_0") = MyDatable
                MyDatable = Nothing
            Else
                GDTracking_0.DataSource = Nothing
                GDTracking_0.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Protected Sub GDTracking_0_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking_0.SelectedIndexChanged
        Try
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
            HiddenField1.Value = 1
            ID = (DirectCast(GDTracking_0.SelectedItems(0), GridDataItem)).GetDataKeyValue("Allocated_to").ToString()
            SqlAction = "SELECT  [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business,syst,Product,Entered_By  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) where Allocated_to='" & ID & "' and Allocated=1 and forwarded=1 and is_complete=1 and ready_for_update=1  and invoiced=0 and BUSINESS='N' order by Receive_dt"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDTracking.DataSource = MyDatable
                GDTracking.DataBind()
                Session("DAD_T_1") = MyDatable
                MyDatable = Nothing
            Else
                SqlAction = "SELECT  [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business,syst,Product,Entered_By   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) where Allocated=0 and  forwarded=1 and is_complete=1 and ready_for_update=1  and BUSINESS='N' order by Receive_dt"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GDTracking.DataSource = MyDatable
                    GDTracking.DataBind()
                    Session("DAD_T_1") = MyDatable
                    MyDatable = Nothing
                Else
                    GDTracking.DataSource = Nothing
                    GDTracking.DataBind()
                End If
            End If
        Catch ex As Exception

        End Try
    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T_1")
        GDTracking.DataBind()
    End Sub
    Protected Sub GDTracking_0_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking_0.PageIndexChanged
        GDTracking_0.CurrentPageIndex = e.NewPageIndex
        GDTracking_0.DataSource = Session("DAD_T_0")
        GDTracking_0.DataBind()
    End Sub

    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String = "Tracking_List"

        Dim MyDatable As New Data.DataTable

        SqlAction = "select File_No,File_status, Business_Type,Proposer_Name,Client_Type,Premium,Is_Mtiba,Receive_dt,ENTRY_DATE,Entered_By,Forwarded_By,Forward_Date, Returned,Medical_UW,Ready_For_update,Doc_Ver_By,Doc_Ver_Date,Allocated_to, allocate_dt,Benefit_verified,Benefit_ver_Date,To_Cashier_dt,Receipt_dt,Update_date,Policy_generated    FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WHERE   ENTRY_DATE Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' and Is_Active=1 AND BUSINESS='N'"

        Session("EXCEL") = "TO EXCEL"
        Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        Session("Mytable") = (Mytable)
        Session("Reportname") = Reportname
        ResponseHelper.Redirect("Reports.aspx", "_blank", "")
        Mytable = Nothing
        System.Threading.Thread.Sleep(5000)
        'Reportname = ""
    End Sub


End Class
