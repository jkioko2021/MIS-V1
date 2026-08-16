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
                Dtfrom.DbSelectedDate = Date.Now
                Dtto.DbSelectedDate = Date.Now
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by Total_Tat desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_1.DataSource = MyDatable
            GD_SUMM_1.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_1.DataSource = Nothing
            GD_SUMM_1.DataBind()
        End If

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by REGISTRATION desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_3.DataSource = MyDatable
            GD_SUMM_3.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_3.DataSource = Nothing
            GD_SUMM_3.DataBind()
        End If


        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by TO_MED_UW desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_4.DataSource = MyDatable
            GD_SUMM_4.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_4.DataSource = Nothing
            GD_SUMM_4.DataBind()
        End If

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by MED_UW desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_5.DataSource = MyDatable
            GD_SUMM_5.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_5.DataSource = Nothing
            GD_SUMM_5.DataBind()
        End If

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by PRICING desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_6.DataSource = MyDatable
            GD_SUMM_6.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_6.DataSource = Nothing
            GD_SUMM_6.DataBind()
        End If

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by MSHIP_ALLOCATE desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_7.DataSource = MyDatable
            GD_SUMM_7.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_7.DataSource = Nothing
            GD_SUMM_7.DataBind()
        End If

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by UPDATE_TAT desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_8.DataSource = MyDatable
            GD_SUMM_8.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_8.DataSource = Nothing
            GD_SUMM_8.DataBind()
        End If

        SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY]  group by File_no,Business_Type order by RECEIPT desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_SUMM_9.DataSource = MyDatable
            GD_SUMM_9.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GD_SUMM_9.DataSource = Nothing
            GD_SUMM_9.DataBind()
        End If
    End Sub
    Protected Sub GD_SUMM_1_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_SUMM_1.PageIndexChanged
        GD_SUMM_1.CurrentPageIndex = e.NewPageIndex
        GD_SUMM_1.DataSource = Session("DAD_T")
        GD_SUMM_1.DataBind()
    End Sub
    Protected Sub GDNOTES_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDNOTES.PageIndexChanged
        GDNOTES.CurrentPageIndex = e.NewPageIndex
        GDNOTES.DataSource = Session("DAD_NOTES")
        GDNOTES.DataBind()
    End Sub
 

    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
      

       
        Try
         
          
           
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub


    Protected Sub cmdview0_Click(sender As Object, e As System.EventArgs) Handles cmdview0.Click
        Try
            GD_SUMM_1.DataSource = Nothing
            GD_SUMM_1.DataBind()
            GD_SUMM_2.DataSource = Nothing
            GD_SUMM_2.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
        
            If TXT_N.Text <> "" Then
                SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] where File_no = '" & Trim(TXT_N.Text) & "'  group by File_no,Business_Type order by Total_Tat desc"
            ElseIf cbotype.SelectedValue <> "" And TXT_N.Text = "" Then
                SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] where Business_Type = '" & Trim(cbotype.SelectedValue) & "' AND Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' group by File_no,Business_Type order by Total_Tat desc"
            Else
                SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] where Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' group by File_no,Business_Type order by Total_Tat desc"
            End If
            'SqlAction = "select top 20 File_no,Business_Type,AVG([REGISTRATION])[REGISTRATION],AVG([TO_MED_UW])[TO_MED_UW],AVG([MED_UW])[MED_UW],AVG([PRICING])[PRICING],AVG(MSHIP_ALLOCATE)MSHIP_ALLOCATE,AVG(UPDATE_TAT)UPDATE_TAT,AVG([RECEIPT])[RECEIPT],(AVG([REGISTRATION]) +AVG([TO_MED_UW]) +AVG([MED_UW])+AVG([PRICING])+AVG(MSHIP_ALLOCATE) +AVG(UPDATE_TAT) +AVG([RECEIPT]))Total_Tat   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by Total_Tat desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_1.DataSource = MyDatable
                GD_SUMM_1.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_1.DataSource = Nothing
                GD_SUMM_1.DataBind()
            End If

            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by REGISTRATION desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_3.DataSource = MyDatable
                GD_SUMM_3.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_3.DataSource = Nothing
                GD_SUMM_3.DataBind()
            End If


            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by TO_MED_UW desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_4.DataSource = MyDatable
                GD_SUMM_4.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_4.DataSource = Nothing
                GD_SUMM_4.DataBind()
            End If

            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by MED_UW desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_5.DataSource = MyDatable
                GD_SUMM_5.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_5.DataSource = Nothing
                GD_SUMM_5.DataBind()
            End If

            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by PRICING desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_6.DataSource = MyDatable
                GD_SUMM_6.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_6.DataSource = Nothing
                GD_SUMM_6.DataBind()
            End If

            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by MSHIP_ALLOCATE desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_7.DataSource = MyDatable
                GD_SUMM_7.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_7.DataSource = Nothing
                GD_SUMM_7.DataBind()
            End If

            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by UPDATE_TAT desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_8.DataSource = MyDatable
                GD_SUMM_8.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_8.DataSource = Nothing
                GD_SUMM_8.DataBind()
            End If

            SqlAction = "select top 10 File_no,Business_Type,sum([REGISTRATION]) [REGISTRATION],sum([TO_MED_UW])[TO_MED_UW],sum([MED_UW])[MED_UW],sum([PRICING])[PRICING],sum(MSHIP_ALLOCATE)MSHIP_ALLOCATE,sum(UPDATE_TAT)UPDATE_TAT,sum([RECEIPT])[RECEIPT],( sum([REGISTRATION]) + sum([TO_MED_UW]) + sum([MED_UW])+ sum([PRICING])+ sum(MSHIP_ALLOCATE) + sum(UPDATE_TAT) + sum([RECEIPT]))TOTAL_TAT   FROM [dbo].[vw_MIS_CRM_TRACKING_TAT_SUMMARY] WHERE Entry_date BETWEEN '" & CDate(Dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(Dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "'  group by File_no,Business_Type order by RECEIPT desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_9.DataSource = MyDatable
                GD_SUMM_9.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_9.DataSource = Nothing
                GD_SUMM_9.DataBind()
            End If
        Catch ex As Exception

        End Try
    End Sub
 
    Protected Sub GD_SUMM_1_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_SUMM_1.SelectedIndexChanged
        Try
            Dim File_no As String = ""
            GD_SUMM_2.DataSource = Nothing
            GD_SUMM_2.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            File_no = (DirectCast(GD_SUMM_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT   [File_No],[Entry_date],[Action_By],[Business_type],[Mon],[Entry_Mon], [Date_From],[Date_To],[Tat],[NAME]  FROM [CRM].[dbo].[vw_MIS_CRM_TRACKING_TAT_DETAILS] WHERE file_no='" & File_no & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_SUMM_2.DataSource = MyDatable
                GD_SUMM_2.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_SUMM_2.DataSource = Nothing
                GD_SUMM_2.DataBind()
            End If


            'Notes
            SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WITH (NOLOCK) WHERE  File_No ='" & File_no & "'  AND ACTIVE=1 ORDER BY Note_id DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
                Session("DAD_NOTES") = MyDatable
                MyDatable = Nothing
            Else
                GDNOTES.DataSource = Nothing
                GDNOTES.DataBind()
            End If
        Catch ex As Exception

        End Try
    End Sub

   
End Class
