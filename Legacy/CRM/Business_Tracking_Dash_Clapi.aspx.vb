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
                Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='PROJECTS'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboNAME
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                    .DataValueField = MyDatatable.Columns("username").ToString
                    .DataBind()
                End With

                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()

        SqlAction = "SELECT  Allocated_to,SUM(RETURNED)RETURNED,SUM(NOT_SUBMITTED)NOT_SUBMITTED,SUM(SUBMITTED)SUBMITTED,SUM(MEDICAL_VETTING)MEDICAL_VETTING,SUM(PRICING_REVIEW)PRICING_REVIEW,SUM(MSHIP_UPDATE)MSHIP_UPDATE, SUM(INVOICED_NOTPAID)INVOICED_NOTPAID, SUM(AWAITING_RECEIPT)AWAITING_RECEIPT,SUM(AWAITING_POLICY)AWAITING_POLICY,SUM(POLICY_VERIFICATION)POLICY_VERIFICATION,SUM(POLICY_APPROVAL)POLICY_APPROVAL, SUM(POLICY_SIGNIN)POLICY_SIGNIN,SUM(AWAITING_DISPACH)AWAITING_DISPACH,SUM(FILED)FILED,SUM(CLOSED)CLOSED,SUM(IT_SUPPORT)IT_SUPPORT  FROM [dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_CLAPI]  GROUP BY Allocated_to"
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
            If chkdate.Checked = True And chkname.Checked = False Then
                SqlAction = "SELECT  Allocated_to,SUM(RETURNED)RETURNED,SUM(NOT_SUBMITTED)NOT_SUBMITTED,SUM(SUBMITTED)SUBMITTED,SUM(MEDICAL_VETTING)MEDICAL_VETTING,SUM(PRICING_REVIEW)PRICING_REVIEW,SUM(MSHIP_UPDATE)MSHIP_UPDATE, SUM(INVOICED_NOTPAID)INVOICED_NOTPAID,	SUM(AWAITING_RECEIPT)AWAITING_RECEIPT,SUM(AWAITING_POLICY)AWAITING_POLICY,SUM(POLICY_SIGNIN)POLICY_SIGNIN,SUM(AWAITING_DISPACH)AWAITING_DISPACH,SUM(FILED)FILED,SUM(CLOSED)CLOSED,SUM(IT_SUPPORT)IT_SUPPORT  FROM [dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_CLAPI] WHERE   Forward_Date Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' GROUP BY Allocated_to"

            ElseIf chkdate.Checked = False And chkname.Checked = True Then
                SqlAction = "SELECT  Allocated_to,SUM(RETURNED)RETURNED,SUM(NOT_SUBMITTED)NOT_SUBMITTED,SUM(SUBMITTED)SUBMITTED,SUM(MEDICAL_VETTING)MEDICAL_VETTING,SUM(PRICING_REVIEW)PRICING_REVIEW,SUM(MSHIP_UPDATE)MSHIP_UPDATE, SUM(INVOICED_NOTPAID)INVOICED_NOTPAID,	SUM(AWAITING_RECEIPT)AWAITING_RECEIPT,SUM(AWAITING_POLICY)AWAITING_POLICY,SUM(POLICY_SIGNIN)POLICY_SIGNIN,SUM(AWAITING_DISPACH)AWAITING_DISPACH,SUM(FILED)FILED,SUM(CLOSED)CLOSED,SUM(IT_SUPPORT)IT_SUPPORT  FROM [dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_CLAPI] WHERE   Allocated_to ='" & cboNAME.SelectedValue & "' GROUP BY Allocated_to"

            ElseIf chkdate.Checked = True And chkname.Checked = True Then
                SqlAction = "SELECT  Allocated_to,SUM(RETURNED)RETURNED,SUM(NOT_SUBMITTED)NOT_SUBMITTED,SUM(SUBMITTED)SUBMITTED,SUM(MEDICAL_VETTING)MEDICAL_VETTING,SUM(PRICING_REVIEW)PRICING_REVIEW,SUM(MSHIP_UPDATE)MSHIP_UPDATE, SUM(INVOICED_NOTPAID)INVOICED_NOTPAID,	SUM(AWAITING_RECEIPT)AWAITING_RECEIPT,SUM(AWAITING_POLICY)AWAITING_POLICY,SUM(POLICY_SIGNIN)POLICY_SIGNIN,SUM(AWAITING_DISPACH)AWAITING_DISPACH,SUM(FILED)FILED,SUM(CLOSED)CLOSED,SUM(IT_SUPPORT)IT_SUPPORT  FROM [dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_CLAPI] WHERE   Allocated_to ='" & cboNAME.SelectedValue & "' and Forward_Date Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' GROUP BY Allocated_to"
            Else
                SqlAction = "SELECT  Allocated_to,SUM(RETURNED)RETURNED,SUM(NOT_SUBMITTED)NOT_SUBMITTED,SUM(SUBMITTED)SUBMITTED,SUM(MEDICAL_VETTING)MEDICAL_VETTING,SUM(PRICING_REVIEW)PRICING_REVIEW,SUM(MSHIP_UPDATE)MSHIP_UPDATE, SUM(INVOICED_NOTPAID)INVOICED_NOTPAID,	SUM(AWAITING_RECEIPT)AWAITING_RECEIPT,SUM(AWAITING_POLICY)AWAITING_POLICY,SUM(POLICY_SIGNIN)POLICY_SIGNIN,SUM(AWAITING_DISPACH)AWAITING_DISPACH,SUM(FILED)FILED,SUM(CLOSED)CLOSED,SUM(IT_SUPPORT)IT_SUPPORT  FROM [dbo].[vw_MIS_CRM_MSHIP_TRACKING_STATUS_CLAPI]  GROUP BY Allocated_to"
            End If
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
            SqlAction = "SELECT  [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business,syst,Product,Entered_By  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) where Allocated_to='" & ID & "' AND  allocate_dt Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' order by File_Status"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDTracking.DataSource = MyDatable
                GDTracking.DataBind()
                Session("DAD_T_1") = MyDatable
                MyDatable = Nothing
            Else
                SqlAction = "SELECT  [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business,syst,Product,Entered_By   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) where Allocated=0 and  allocate_dt Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' order by File_Status"
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
        Session("DAD_5") = Nothing
        If chkdate.Checked = True And chkname.Checked = False Then
            SqlAction = "select File_No,File_status, Business_Type,Proposer_Name,Client_Type,Premium,Is_Mtiba,Receive_dt,ENTRY_DATE,Entered_By,Forwarded_By,Forward_Date, Returned,Medical_UW,Ready_For_update,Doc_Ver_By,Doc_Ver_Date,Allocated_to, allocate_dt,Benefit_verified,Benefit_ver_Date,To_Cashier_dt,Receipt_dt,Update_date,Policy_generated ,Policy_Verification_Dt,Policy_Approve_Dt, Policy_Sign_Dt,Policy_Disp_Dt,syst,Product  FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WHERE   allocate_dt Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' and Is_Active=1"

        ElseIf chkdate.Checked = False And chkname.Checked = True Then
            SqlAction = "select File_No,File_status, Business_Type,Proposer_Name,Client_Type,Premium,Is_Mtiba,Receive_dt,Entered_By,Forwarded_By,Forward_Date,Returned,Medical_UW,Ready_For_update,Doc_Ver_By,Doc_Ver_Date,Allocated_to, allocate_dt,Benefit_verified,Benefit_ver_Date,To_Cashier_dt,Receipt_dt,Update_date,Policy_generated ,Policy_Verification_Dt,Policy_Approve_Dt,Policy_Sign_Dt,Policy_Disp_Dt,syst,Product  FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WHERE   Allocated_To ='" & cboNAME.SelectedValue & "' and Is_Active=1"

        ElseIf chkdate.Checked = True And chkname.Checked = True Then
            SqlAction = "select File_No,File_status, Business_Type,Proposer_Name,Client_Type,Premium,Is_Mtiba,Receive_dt,Entered_By,Forwarded_By,Forward_Date,Returned,Medical_UW,Ready_For_update,Doc_Ver_By,Doc_Ver_Date,Allocated_to, allocate_dt,Benefit_verified,Benefit_ver_Date,To_Cashier_dt,Receipt_dt,Update_date,Policy_generated ,Policy_Verification_Dt,Policy_Approve_Dt,Policy_Sign_Dt,Policy_Disp_Dt,syst,Product  FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WHERE   Allocated_To ='" & cboNAME.SelectedValue & "' and allocate_dt Between '" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and '" & CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd") & "' and Is_Active=1"
        Else
            SqlAction = "select File_No,File_status, Business_Type,Proposer_Name,Client_Type,Premium,Is_Mtiba,Receive_dt,Entered_By,Forwarded_By,Forward_Date,Returned,Medical_UW,Ready_For_update,Doc_Ver_By,Doc_Ver_Date,Allocated_to, allocate_dt,Benefit_verified,Benefit_ver_Date,To_Cashier_dt,Receipt_dt,Update_date,Policy_generated ,Policy_Verification_Dt,Policy_Approve_Dt,Policy_Sign_Dt,Policy_Disp_Dt,syst,Product  FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] where Is_Active=1"
        End If

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
