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
    Dim empcode As String = ""

    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            empcode = ""
            cboRE.SelectedValue = ""
            cboyear.SelectedValue = Session("YEAR")
            Str = "SELECT Emp_Code FROM	employees  WHERE username ='" & Session("username") & "'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatatable.Rows.Count > 0 Then
                empcode = MyDatatable.Rows(0).Item("Emp_Code").ToString()
                'empcode = "0114"
            Else
                lbltext.Text = "You are not authorized to view this page"
                Exit Sub
            End If
            Str = "SELECT RE_NAME,RE_CODE FROM TBL_MIS_CRM_RMS where IS_ACTIVE=1 AND YEAR='" & cboyear.SelectedValue & "' AND RE_CODE='" & empcode & "' AND C_CODE='R' ORDER BY RE_NAME" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboRE
                .Items.Clear()

                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("RE_NAME").ToString
                .DataValueField = MyDatatable.Columns("RE_CODE").ToString
                .DataBind()

            End With

            SqlAction = "SELECT CLASS_CODE FROM TBL_MIS_CRM_RMS where IS_ACTIVE=1 AND YEAR=YEAR('" & Session("DTTO") & "') AND RE_CODE='" & empcode & "'  AND C_CODE='R'"
            Dim MyDatable As New Data.DataTable
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblclass.Text = MyDatable.Rows(0).Item("CLASS_CODE").ToString()
            End If

            Session("EXCEL") = Nothing

            SqlAction = "SELECT  MIN([DATE_FROM])DATE_FROM,MIN([DATE_TO])DATE_TO FROM [SALES].[dbo].[TBL_MIS_PROD_MONTHS] WHERE [MONTH_CLOSED] =0"

            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                dtDateFrom.DbSelectedDate = CDate(MyDatable.Rows(0).Item("DATE_FROM")).ToString("yyyy-MM-dd")
                dtDateTo.DbSelectedDate = CDate(MyDatable.Rows(0).Item("DATE_TO")).ToString("yyyy-MM-dd") ' MyDatable.Rows(0).Item("DATE_TO").ToString()
                dtDateFrom_1.DbSelectedDate = CDate(MyDatable.Rows(0).Item("DATE_FROM").ToString()).ToString("yyyy-MM-dd")
                dtDateTo_1.DbSelectedDate = CDate(MyDatable.Rows(0).Item("DATE_TO").ToString()).ToString("yyyy-MM-dd")

            End If

            LOADGRID()
        End If
    End Sub
    Public Sub LOADGRID()
        GD_PORT_MED_1.DataSource = Nothing
        GD_PORT_MED_1.DataBind()
        GD_PORT_MED.DataSource = Nothing
        GD_PORT_MED.DataBind()
        GD_PORT_NON_1.DataSource = Nothing
        GD_PORT_NON_1.DataBind()
        GD_MED_POLICY.DataSource = Nothing
        GD_MED_POLICY.DataBind()
        GD_NON_POLICY.DataSource = Nothing
        GD_NON_POLICY.DataBind()
        SqlAction = "SELECT [RE_CODE],[RE_NAME],[CLASS_CODE],SUM([RENEW_MEDICAL])[RENEW_MEDICAL],SUM([ACTUAL_RENEW_MED])[ACTUAL_RENEW_MED],(SUM([ACTUAL_RENEW])/NULLIF(SUM([RENEWAL_BUDGET]),0))*100 [RENEW_PERC_MED],SUM([RENEW_NON_MEDICAL])[RENEW_NON_MEDICAL],SUM([ACTUAL_RENEW_NONMED])[ACTUAL_RENEW_NONMED],isnull((SUM([ACTUAL_RENEW_NONMED])/NULLIF(SUM([RENEW_NON_MEDICAL]),0))*100,0) [RENEW_PERC_NONMED],SUM(RENEWAL_BUDGET)RENEWAL_BUDGET,SUM(ACTUAL_RENEW)ACTUAL_RENEW,SUM([DEFICIT])[DEFICIT],(SUM([ACTUAL_RENEW])/NULLIF(SUM([RENEWAL_BUDGET]),0))*100 [PERC_PRODUCTION],SUM(CNT_POLICY_MED)CNT_POLICY_MED,SUM(ACT_CNT_MED)ACT_CNT_MED,SUM(CNT_POLICY_NON)CNT_POLICY_NON,SUM(ACT_CNT_NON)ACT_CNT_NON  FROM [CRM].[dbo].[TBL_SALES_RE_SUMMARY_MTD] WHERE   MONTH_FROM >= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND [RE_CODE]='" & cboRE.SelectedValue & "' AND CLASS_CODE='" & lblclass.Text & "' GROUP BY [RE_CODE],[RE_NAME],[CLASS_CODE]"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDSEARCH_U.DataSource = MyDatable
            GDSEARCH_U.DataBind()
            'Session("DAD_5") = MyDatable
            MyDatable = Nothing
        Else
            GDSEARCH_U.DataSource = Nothing
            GDSEARCH_U.DataBind()
        End If
        SqlAction = "SELECT  PROPOSER_DISPLAY_NAME,INVOICE_NO,CONVERT(date,INVOICE_DATE)INVOICE_DATE ,SUM(PREMIUM)PREMIUM,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE  FROM [SALES].[dbo].[TBL_MIS_SALES_PRODUCTION] WHERE INVOICE_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND RM_RET_CODE ='" & cboRE.SelectedValue & "' AND PLAN_CODE='I' AND BUSINESS_TYPE='RENEWAL' AND BUSINESS='MEDICAL' GROUP BY PROPOSER_DISPLAY_NAME,INVOICE_NO,INVOICE_DATE,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE ORDER BY SUM(PREMIUM) DESC"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDMED.DataSource = MyDatable
            GDMED.DataBind()
            Session("DAD_5_2") = MyDatable
            MyDatable = Nothing
        Else
            GDMED.DataSource = Nothing
            GDMED.DataBind()
        End If

        SqlAction = "SELECT  PROPOSER_DISPLAY_NAME,INVOICE_NO,CONVERT(date,INVOICE_DATE)INVOICE_DATE ,SUM(PREMIUM)PREMIUM,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE  FROM [SALES].[dbo].[TBL_MIS_SALES_PRODUCTION] WHERE INVOICE_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND RM_RET_CODE ='" & cboRE.SelectedValue & "' AND PLAN_CODE='I' AND BUSINESS_TYPE='RENEWAL' AND BUSINESS='NON-MED' GROUP BY PROPOSER_DISPLAY_NAME,INVOICE_NO,INVOICE_DATE,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE ORDER BY SUM(PREMIUM) DESC"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_NON.DataSource = MyDatable
            GD_NON.DataBind()
            Session("DAD_5_3") = MyDatable
            MyDatable = Nothing
        Else
            GD_NON.DataSource = Nothing
            GD_NON.DataBind()
        End If

        'PORTFOLIO
        SqlAction = "SELECT  [RM_CODE],[RM_NAME], SUM([M_CNT_POLICY])[M_CNT_POLICY],SUM([M_PREM])[M_PREM],SUM([M_CNT_LIVES])[M_CNT_LIVES],SUM([M_EARNED_PREMIUM])[M_EARNED_PREMIUM],SUM([M_CLAIM_RATIO])[M_CLAIM_RATIO],SUM([MED_CLAIMS])[MED_CLAIMS],SUM([NON_PREM])[NON_PREM] FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE]  WHERE   MONTH_FROM >= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND [RM_CODE]='" & cboRE.SelectedValue & "' AND CLASS_CODE='" & lblclass.Text & "' GROUP BY [RM_CODE],[RM_NAME]"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_PORT_MED.DataSource = MyDatable
            GD_PORT_MED.DataBind()
            'Session("DAD_5") = MyDatable
            MyDatable = Nothing
        Else
            GD_PORT_MED.DataSource = Nothing
            GD_PORT_MED.DataBind()
        End If
        SqlAction = "SELECT  [RM_CODE],[RM_NAME],SUM([NON_PREM])[NON_PREM],SUM([NON_CNT_POLICY])[NON_CNT_POLICY],SUM([NON_CNT_LIVES])[NON_CNT_LIVES]  FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE]  WHERE   MONTH_FROM >= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND [RM_CODE]='" & cboRE.SelectedValue & "' AND CLASS_CODE='" & lblclass.Text & "' GROUP BY [RM_CODE],[RM_NAME]"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_PORT_NON.DataSource = MyDatable
            GD_PORT_NON.DataBind()
            'Session("DAD_5_X") = MyDatable
            MyDatable = Nothing
        Else
            GD_PORT_NON.DataSource = Nothing
            GD_PORT_NON.DataBind()
        End If

        'POLICY LISTING
        SqlAction = "select PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,PREMIUMS,LIVES,CONTACT_PERSON,MOBILE_NO,PROPOSER_ID,AGENCY_CODE from [dbo].[TBL_MIS_RET_RETAIL]  WHERE   [RM_CODE]='" & cboRE.SelectedValue & "' AND BUSINESS='MEDICAL' ORDER BY PREMIUMS"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_MED_POLICY.DataSource = MyDatable
            GD_MED_POLICY.DataBind()
            Session("DAD_5_4") = MyDatable
            MyDatable = Nothing
        Else
            GD_MED_POLICY.DataSource = Nothing
            GD_MED_POLICY.DataBind()
        End If
        SqlAction = "select PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,sum(PREMIUMS)PREMIUMS,LIVES,CONTACT_PERSON,MOBILE_NO from [dbo].[TBL_MIS_RET_RETAIL]   WHERE   [RM_CODE]='" & cboRE.SelectedValue & "' AND BUSINESS='NON-MED' group by PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,LIVES,CONTACT_PERSON,MOBILE_NO ORDER BY PREMIUMS"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_NON_POLICY.DataSource = MyDatable
            GD_NON_POLICY.DataBind()
            Session("DAD_5_5") = MyDatable
            MyDatable = Nothing
        Else
            GD_NON_POLICY.DataSource = Nothing
            GD_NON_POLICY.DataBind()
        End If
    End Sub
    Protected Sub SEARCH_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles SEARCH.Click
        'SELECT [MONTH_FROM],[MONTH_TO],[NEW_BUDGET],[RENEWAL_BUDGET],[MONTH_BUDGET],[UNIT_NAME],UNIT_CODE,BRANCH_CODE,R_CODE  FROM [SALES].[dbo].[vw_UM_BUDGET] WHERE UNIT_CODE='U001'
        GDSEARCH_U_1.DataSource = Nothing
        GDSEARCH_U_1.DataBind()

        GDMED.DataSource = Nothing
        GDMED.DataBind()
        GD_NON.DataSource = Nothing
        GD_NON.DataBind()
        GD_PORT_MED_1.DataSource = Nothing
        GD_PORT_MED_1.DataBind()
        GD_PORT_MED.DataSource = Nothing
        GD_PORT_MED.DataBind()
        GD_PORT_NON_1.DataSource = Nothing
        GD_PORT_NON_1.DataBind()
        GD_MED_POLICY.DataSource = Nothing
        GD_MED_POLICY.DataBind()
        GD_NON_POLICY.DataSource = Nothing
        GD_NON_POLICY.DataBind()
        'GDSEARCH_3.DataSource = N
        Try

            SqlAction = "SELECT [RE_CODE],[RE_NAME],[CLASS_CODE],SUM([RENEW_MEDICAL])[RENEW_MEDICAL],SUM([ACTUAL_RENEW_MED])[ACTUAL_RENEW_MED],(SUM([ACTUAL_RENEW])/NULLIF(SUM([RENEWAL_BUDGET]),0))*100 [RENEW_PERC_MED],SUM([RENEW_NON_MEDICAL])[RENEW_NON_MEDICAL],SUM([ACTUAL_RENEW_NONMED])[ACTUAL_RENEW_NONMED],isnull((SUM([ACTUAL_RENEW_NONMED])/NULLIF(SUM([RENEW_NON_MEDICAL]),0))*100,0) [RENEW_PERC_NONMED],SUM(RENEWAL_BUDGET)RENEWAL_BUDGET,SUM(ACTUAL_RENEW)ACTUAL_RENEW,SUM([DEFICIT])[DEFICIT],(SUM([ACTUAL_RENEW])/NULLIF(SUM([RENEWAL_BUDGET]),0))*100 [PERC_PRODUCTION],SUM(CNT_POLICY_MED)CNT_POLICY_MED,SUM(ACT_CNT_MED)ACT_CNT_MED,SUM(CNT_POLICY_NON)CNT_POLICY_NON,SUM(ACT_CNT_NON)ACT_CNT_NON  FROM [CRM].[dbo].[TBL_SALES_RE_SUMMARY_MTD] WHERE   MONTH_FROM >= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND [RE_CODE]='" & cboRE.SelectedValue & "' AND CLASS_CODE='" & lblclass.Text & "' GROUP BY [RE_CODE],[RE_NAME],[CLASS_CODE]"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_U.DataSource = MyDatable
                GDSEARCH_U.DataBind()
                'Session("DAD_5") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_U.DataSource = Nothing
                GDSEARCH_U.DataBind()
            End If
            'SELECT  [USER_ID] ,[AGENT_NAME],[UNIT_CODE],[BRANCH_CODE],[R_CODE],[MONTH_FROM],[MONTH_TO],[NEW_BUDGET],[ACTUAL_NEW],[RENEWAL_BUDGET],[ACTUAL_RENEW],[MONTH_BUDGET],[ACTUAL_PROD],[DEFICIT],[PERC_PRODUCTION],[PER_NEW],[PER_REN]	  FROM [TBL_SALES_AGENT_SUMMARY_MTD]
            SqlAction = "SELECT  PROPOSER_DISPLAY_NAME,INVOICE_NO,CONVERT(date,INVOICE_DATE)INVOICE_DATE ,SUM(PREMIUM)PREMIUM,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE  FROM [SALES].[dbo].[TBL_MIS_SALES_PRODUCTION] WHERE INVOICE_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND RM_RET_CODE ='" & cboRE.SelectedValue & "' AND PLAN_CODE='I' AND BUSINESS_TYPE='RENEWAL' GROUP BY PROPOSER_DISPLAY_NAME,INVOICE_NO,INVOICE_DATE,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE  ORDER BY SUM(PREMIUM) DESC"

            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDMED.DataSource = MyDatable
                GDMED.DataBind()
                Session("DAD_5_2") = MyDatable
                MyDatable = Nothing
            Else
                GDMED.DataSource = Nothing
                GDMED.DataBind()
            End If

            SqlAction = "SELECT  PROPOSER_DISPLAY_NAME,INVOICE_NO,CONVERT(date,INVOICE_DATE)INVOICE_DATE ,SUM(PREMIUM)PREMIUM,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE  FROM [SALES].[dbo].[TBL_MIS_SALES_PRODUCTION] WHERE INVOICE_DATE BETWEEN '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND RM_RET_CODE ='" & cboRE.SelectedValue & "' AND PLAN_CODE='I' AND BUSINESS_TYPE='RENEWAL' AND BUSINESS='NON-MED' GROUP BY PROPOSER_DISPLAY_NAME,INVOICE_NO,INVOICE_DATE,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE  ORDER BY SUM(PREMIUM) DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_NON.DataSource = MyDatable
                GD_NON.DataBind()
                Session("DAD_5_3") = MyDatable
                MyDatable = Nothing
            Else
                GD_NON.DataSource = Nothing
                GD_NON.DataBind()
            End If

            'PORTFOLIO
            SqlAction = "SELECT  [RM_CODE],[RM_NAME], SUM([M_CNT_POLICY])[M_CNT_POLICY],SUM([M_PREM])[M_PREM],SUM([M_CNT_LIVES])[M_CNT_LIVES],SUM([M_EARNED_PREMIUM])[M_EARNED_PREMIUM],SUM([M_CLAIM_RATIO])[M_CLAIM_RATIO],SUM([MED_CLAIMS])[MED_CLAIMS],SUM([NON_PREM])[NON_PREM] FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE]  WHERE   MONTH_FROM >= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND [RM_CODE]='" & cboRE.SelectedValue & "' AND CLASS_CODE='" & lblclass.Text & "' GROUP BY [RM_CODE],[RM_NAME]"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PORT_MED.DataSource = MyDatable
                GD_PORT_MED.DataBind()
                'Session("DAD_5") = MyDatable
                MyDatable = Nothing
            Else
                GD_PORT_MED.DataSource = Nothing
                GD_PORT_MED.DataBind()
            End If
            SqlAction = "SELECT  [RM_CODE],[RM_NAME],SUM([NON_PREM])[NON_PREM],SUM([NON_CNT_POLICY])[NON_CNT_POLICY],SUM([NON_CNT_LIVES])[NON_CNT_LIVES]  FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE]  WHERE   MONTH_FROM >= '" & CDate(dtDateFrom.SelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & "' AND [RM_CODE]='" & cboRE.SelectedValue & "' AND CLASS_CODE='" & lblclass.Text & "' GROUP BY [RM_CODE],[RM_NAME]"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PORT_NON.DataSource = MyDatable
                GD_PORT_NON.DataBind()
                MyDatable = Nothing
            Else
                GD_PORT_NON.DataSource = Nothing
                GD_PORT_NON.DataBind()
            End If

            'POLICY LISTING
            SqlAction = "select PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,PREMIUMS,LIVES,CONTACT_PERSON,MOBILE_NO,PROPOSER_ID,AGENCY_CODE from [dbo].[TBL_MIS_RET_RETAIL]  WHERE   [RM_CODE]='" & cboRE.SelectedValue & "' AND BUSINESS='MEDICAL'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_MED_POLICY.DataSource = MyDatable
                GD_MED_POLICY.DataBind()
                Session("DAD_5_4") = MyDatable
                MyDatable = Nothing
            Else
                GD_MED_POLICY.DataSource = Nothing
                GD_MED_POLICY.DataBind()
            End If
            SqlAction = "select PROPOSER_DISPLAY_NAME,PERIOD_FROM,PERIOD_TO,PREMIUMS,LIVES,CONTACT_PERSON,MOBILE_NO,PROPOSER_ID,AGENCY_CODE from [dbo].[TBL_MIS_RET_RETAIL]  WHERE   [RM_CODE]='" & cboRE.SelectedValue & "' AND BUSINESS='NON-MED'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_NON_POLICY.DataSource = MyDatable
                GD_NON_POLICY.DataBind()
                Session("DAD_5_5") = MyDatable
                MyDatable = Nothing
            Else
                GD_NON_POLICY.DataSource = Nothing
                GD_NON_POLICY.DataBind()
            End If
        Catch ex As Exception
        End Try
    End Sub

    Protected Sub GDSEARCH_U_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDSEARCH_U.PageIndexChanged
        GDSEARCH_U.CurrentPageIndex = e.NewPageIndex
        GDSEARCH_U.DataSource = Session("S_1")
        GDSEARCH_U.DataBind()
    End Sub

    Protected Sub GDMED_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDMED.PageIndexChanged
        GDMED.CurrentPageIndex = e.NewPageIndex
        GDMED.DataSource = Session("DAD_5_2")
        GDMED.DataBind()
    End Sub
    Protected Sub GD_NON_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_NON.PageIndexChanged
        GD_NON.CurrentPageIndex = e.NewPageIndex
        GD_NON.DataSource = Session("DAD_5_3")
        GD_NON.DataBind()
    End Sub
    Protected Sub GD_MED_POLICY_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_MED_POLICY.PageIndexChanged
        GD_MED_POLICY.CurrentPageIndex = e.NewPageIndex
        GD_MED_POLICY.DataSource = Session("DAD_5_4")
        GD_MED_POLICY.DataBind()
    End Sub
    Protected Sub GD_NON_POLICY_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_NON_POLICY.PageIndexChanged
        GD_NON_POLICY.CurrentPageIndex = e.NewPageIndex
        GD_NON_POLICY.DataSource = Session("DAD_5_5")
        GD_NON_POLICY.DataBind()
    End Sub
    Protected Sub GDSEARCH_U_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GDSEARCH_U.SelectedIndexChanged
        Dim USER_ID As String = ""

        GDSEARCH_U_1.DataSource = Nothing
        GDSEARCH_U_1.DataBind()
        Try
            USER_ID = (DirectCast(GDSEARCH_U.SelectedItems(0), GridDataItem)).GetDataKeyValue("RE_CODE").ToString()
            SqlAction = "SELECT [RE_CODE],[RE_NAME],MONTH_FROM,MONTH_TO, [CLASS_CODE],[RENEW_MEDICAL],[ACTUAL_RENEW_MED],[RENEW_PERC_MED],[RENEW_NON_MEDICAL],[ACTUAL_RENEW_NONMED],[RENEW_PERC_NONMED],RENEWAL_BUDGET,ACTUAL_RENEW,[DEFICIT],[PERC_PRODUCTION] ,CNT_POLICY_MED,ACT_CNT_MED,CNT_POLICY_NON,ACT_CNT_NON FROM [CRM].[dbo].[TBL_SALES_RE_SUMMARY_MTD] WHERE  [RE_CODE]='" & cboRE.SelectedValue & "'  AND  MONTH_FROM >='" & CDate(dtDateFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND CLASS_CODE='" & lblclass.Text & "' ORDER BY MONTH_FROM"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_U_1.DataSource = MyDatable
                GDSEARCH_U_1.DataBind()
                MyDatable = Nothing
            Else
                GDSEARCH_U_1.DataSource = Nothing
                GDSEARCH_U_1.DataBind()
            End If

        Catch ex As Exception

        End Try

    End Sub

    Protected Sub GD_PORT_MED_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GD_PORT_MED.SelectedIndexChanged
        Dim USER_ID As String = ""

        GD_PORT_MED_1.DataSource = Nothing
        GD_PORT_MED_1.DataBind()
        Try
            USER_ID = (DirectCast(GD_PORT_MED.SelectedItems(0), GridDataItem)).GetDataKeyValue("RM_CODE").ToString()
            SqlAction = "SELECT [MONTH_FROM],[MONTH_TO],[M_CNT_POLICY],[M_PREM],[M_CNT_LIVES],[M_EARNED_PREMIUM],[M_CLAIM_RATIO],[MED_CLAIMS] FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE] WHERE  [RM_CODE]='" & cboRE.SelectedValue & "'  AND  MONTH_FROM >='" & CDate(dtDateFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND CLASS_CODE='" & lblclass.Text & "' ORDER BY MONTH_FROM"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PORT_MED_1.DataSource = MyDatable
                GD_PORT_MED_1.DataBind()
                MyDatable = Nothing
            Else
                GD_PORT_MED_1.DataSource = Nothing
                GD_PORT_MED_1.DataBind()
            End If

        Catch ex As Exception

        End Try

    End Sub
    Protected Sub GD_PORT_NON_SelectedIndexChanged(ByVal sender As Object, ByVal e As System.EventArgs) Handles GD_PORT_NON.SelectedIndexChanged
        Dim USER_ID As String = ""

        GD_PORT_NON_1.DataSource = Nothing
        GD_PORT_NON_1.DataBind()
        Try
            USER_ID = (DirectCast(GD_PORT_MED.SelectedItems(0), GridDataItem)).GetDataKeyValue("RM_CODE").ToString()
            SqlAction = "SELECT [MONTH_FROM],[MONTH_TO],[NON_PREM],[NON_CNT_POLICY],[NON_CNT_LIVES] FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE] WHERE  [RM_CODE]='" & cboRE.SelectedValue & "'  AND  MONTH_FROM >='" & CDate(dtDateFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND CLASS_CODE='" & lblclass.Text & "' ORDER BY MONTH_FROM"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PORT_NON_1.DataSource = MyDatable
                GD_PORT_NON_1.DataBind()
                MyDatable = Nothing
            Else
                GD_PORT_NON_1.DataSource = Nothing
                GD_PORT_NON_1.DataBind()
            End If

        Catch ex As Exception

        End Try

    End Sub
    Protected Sub RadButton1_Click(ByVal sender As Object, ByVal e As System.EventArgs) Handles btnGenerate.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String
        Session("Mytable") = Nothing
        Session("Reportname") = Nothing

        Session("EXCEL") = "TO EXCEL"
        If cbotype.SelectedValue = "D" Then
            Reportname = "Debits As At-& " & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & ""
            SqlAction = "SELECT  PROPOSER_DISPLAY_NAME,INVOICE_NO,CONVERT(date,INVOICE_DATE)INVOICE_DATE ,SUM(PREMIUM)PREMIUM,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,PERIOD_FROM,PERIOD_TO,AGENT_TYPE,PLAN_CODE  FROM [SALES].[dbo].[TBL_MIS_SALES_PRODUCTION] WHERE INVOICE_DATE BETWEEN '" & CDate(dtDateFrom_1.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo_1.SelectedDate).ToString("yyyy-MM-dd") & "' AND RM_RET_CODE ='" & cboRE.SelectedValue & "' AND PLAN_CODE='I' AND BUSINESS_TYPE='RENEWAL' GROUP BY PROPOSER_DISPLAY_NAME,INVOICE_NO,INVOICE_DATE,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE,PERIOD_FROM,PERIOD_TO"

        ElseIf cbotype.SelectedValue = "P" Then
            Reportname = "Production As At-& " & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & ""
            SqlAction = "SELECT  PROPOSER_DISPLAY_NAME,INVOICE_NO,CONVERT(date,INVOICE_DATE)INVOICE_DATE ,SUM(PREMIUM)PREMIUM,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,PERIOD_FROM,PERIOD_TO,AGENT_TYPE,PLAN_CODE  FROM [SALES].[dbo].[TBL_MIS_SALES_PRODUCTION] WHERE INVOICE_DATE BETWEEN '" & CDate(dtDateFrom_1.SelectedDate).ToString("yyyy-MM-dd") & "' AND '" & CDate(dtDateTo_1.SelectedDate).ToString("yyyy-MM-dd") & "' AND RM_RET_CODE ='" & cboRE.SelectedValue & "' AND PLAN_CODE='I' AND BUSINESS_TYPE='RENEWAL' GROUP BY PROPOSER_DISPLAY_NAME,INVOICE_NO,INVOICE_DATE,BUSINESS_TYPE,USER_DISPLAY_NAME,BUSINESS,AGENT_TYPE,PLAN_CODE"
        ElseIf cbotype.SelectedValue = "PL" Then
            Reportname = "PolicyListing As At-& " & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & ""
            SqlAction = "select PROPOSER_DISPLAY_NAME,CONVERT(date,PERIOD_FROM)PERIOD_FROM ,CONVERT(date,PERIOD_TO)PERIOD_TO,PREMIUMS,LIVES,CONTACT_PERSON,MOBILE_NO,AGENT_NAME,BUSINESS from [dbo].[TBL_MIS_RET_RETAIL]  WHERE   [RM_CODE]='" & cboRE.SelectedValue & "'"
        ElseIf cbotype.SelectedValue = "PO" Then
            Reportname = "Portfolio As At-& " & CDate(dtDateTo.SelectedDate).ToString("yyyy-MM-dd") & ""
            SqlAction = "SELECT [MONTH_FROM],[MONTH_TO],[M_CNT_POLICY],[M_PREM],[M_CNT_LIVES],[M_EARNED_PREMIUM],[M_CLAIM_RATIO],[MED_CLAIMS] FROM [CRM].[dbo].[TBL_MIS_CRM_PORTFOLIO_RE] WHERE  [RM_CODE]='" & cboRE.SelectedValue & "'  AND  MONTH_FROM >='" & CDate(dtDateFrom_1.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND MONTH_TO <='" & CDate(dtDateTo_1.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND CLASS_CODE='" & lblclass.Text & "' ORDER BY MONTH_FROM"
        End If
        Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If Mytable.Rows.Count > 0 Then
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
        End If
    End Sub
End Class
