Imports System.Data.SqlClient
Imports DocManage
Imports System
Imports System.Collections
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Web
Imports System.Web.SessionState
Imports System.Web.UI
Imports System.Web.UI.WebControls
Imports System.Web.UI.HtmlControls
Imports Telerik.Web.UI
Imports Telerik.Charting
Partial Class _Default
    Inherits System.Web.UI.Page
    Public ActionIsRefresh As Boolean = False
    Private _dockStateCleared As Boolean = False
    Private MyDBAction As New DataManagement
    Dim MyDatatable As DataTable : Dim Str As String
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""
    Dim EMPCODE As String = ""
    Dim USER_ID As String = ""
    Dim UNIT_CODE As String = ""
    Dim REGION_CODE As String = ""
    Dim BRANCH_CODE As String = ""

    Dim NSM As String = ""


    Dim SqlAction As String = ""
    Private Property CurrentDockStates() As List(Of DockState)
        Get

            Dim _currentDockStates As List(Of DockState) = DirectCast(Session("CurrentDockStatesMyPortal"), List(Of DockState))
            If [Object].Equals(_currentDockStates, Nothing) Then
                _currentDockStates = New List(Of DockState)()
                Session("CurrentDockStatesMyPortal") = _currentDockStates
            End If
            Return _currentDockStates
        End Get
        Set(value As List(Of DockState))
            Session("CurrentDockStatesMyPortal") = value
        End Set
    End Property
    Protected Sub Page_Load(ByVal sender As Object, ByVal e As System.EventArgs) Handles Me.Load
        If Not Page.IsPostBack Then

            Session("YEAR") = Nothing
            cboname.Items.Clear()
            GD_N3.DataSource = Nothing
            GD_N3.DataBind()
            P6.Visible = True
            Panel2.Visible = True
            Panel4.Visible = True
            Panel5.Visible = True
            L2.Visible = True
            L4.Visible = True
            P0.Visible = False

            SqlAction = "SELECT  MIN([DATE_FROM])DATE_FROM,MIN([DATE_TO])DATE_TO FROM [SALES].[dbo].[TBL_MIS_PROD_MONTHS] WHERE [MONTH_CLOSED] =0"
            Dim MyDatable As New Data.DataTable
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDatable.Rows.Count > 0 Then
                Session("YEAR") = Year(CDate(MyDatable.Rows(0).Item("DATE_FROM")).ToString("yyyy-MM-dd"))
                lblyear.Text = Session("YEAR")
            End If
            Str = "SELECT Emp_Code FROM	employees  WHERE username ='" & Session("username") & "'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatatable.Rows.Count > 0 Then
                EMPCODE = MyDatatable.Rows(0).Item("Emp_Code").ToString()
                'EMPCODE = "0115" 'nelson
                'EMPCODE = "0081" 'brian
                'EMPCODE = "0491" 'KALEMIA
                'EMPCODE = "0104" 'lenard
                'EMPCODE = "0503" 'mary
                'EMPCODE = "0598" 'mary
                'EMPCODE = "0502" 'NSM
                'EMPCODE = "0606" 'ADM
            Else
                Exit Sub
            End If

            Str = "SELECT RE_NAME,RE_CODE FROM TBL_MIS_CRM_RMS where IS_ACTIVE=1 AND YEAR=YEAR('" & Session("YEAR") & "') AND RE_CODE='" & EMPCODE & "'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatatable.Rows.Count > 0 Then
                BRANCH_CODE = MyDatatable.Rows(0).Item("RE_CODE").ToString()
                Session("NAME") = "RE"
                Overal_Level(BRANCH_CODE)
                  With cboname
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("RE_NAME").ToString
                    .DataValueField = MyDatatable.Columns("RE_CODE").ToString
                    .DataBind()
                End With

            Else
                Str = "SELECT [MGR_CODE],[MGR_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_CLASS_MGR] where IS_ACTIVE=1 AND YEAR=YEAR('" & Session("YEAR") & "') AND EMP_CODE='" & EMPCODE & "' ORDER BY MGR_NAME" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    BRANCH_CODE = MyDatatable.Rows(0).Item("MGR_CODE").ToString()
                    Session("NAME") = "CLASS"
                    Overal_Level(BRANCH_CODE)
                    With cboname
                        .Items.Clear()
                        .DataSource = MyDatatable
                        .DataTextField = MyDatatable.Columns("MGR_NAME").ToString
                        .DataValueField = MyDatatable.Columns("MGR_CODE").ToString
                        .DataBind()
                    End With
                Else
                    Str = "SELECT [NSM_CODE] ,[NSM_NAME]   FROM [CRM].[dbo].[TBL_MIS_CRM_NSM] where IS_ACTIVE=1 AND NSM_YEAR=YEAR('" & Session("YEAR") & "') AND EMP_CODE='" & EMPCODE & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        BRANCH_CODE = MyDatatable.Rows(0).Item("NSM_CODE").ToString()
                        Session("NAME") = "NSM"
                        Overal_Level(BRANCH_CODE)
                        With cboname
                            .Items.Clear()
                            .DataSource = MyDatatable
                            .DataTextField = MyDatatable.Columns("NSM_NAME").ToString
                            .DataValueField = MyDatatable.Columns("NSM_CODE").ToString
                            .DataBind()
                        End With
                    Else
                        Str = "SELECT [ADMIN_CODE] ,[ADMIN_NAME]   FROM [CRM].[dbo].[TBL_MIS_CRM_RETENTION_ADMIN] where IS_ACTIVE=1 AND ADMIN_YEAR=YEAR('" & Session("YEAR") & "') AND EMP_CODE='" & EMPCODE & "'" '"
                        MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                        If MyDatatable.Rows.Count > 0 Then
                            BRANCH_CODE = MyDatatable.Rows(0).Item("ADMIN_CODE").ToString()
                            Session("NAME") = "NSM"
                            Overal_Level(BRANCH_CODE)
                            With cboname
                                .Items.Clear()
                                .DataSource = MyDatatable
                                .DataTextField = MyDatatable.Columns("ADMIN_NAME").ToString
                                .DataValueField = MyDatatable.Columns("ADMIN_CODE").ToString
                                .DataBind()
                            End With
                        Else
                            Str = "SELECT username ,[employeename]   FROM [CRM].[dbo].[employees] where   EMP_CODE='" & EMPCODE & "'" '"
                            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                            If MyDatatable.Rows.Count > 0 Then
                                BRANCH_CODE = MyDatatable.Rows(0).Item("username").ToString()
                                Session("NAME") = "BPO"
                                Overal_Level(Session("NAME"))
                                With cboname
                                    .Items.Clear()
                                    .DataSource = MyDatatable
                                    .DataTextField = MyDatatable.Columns("employeename").ToString
                                    .DataValueField = MyDatatable.Columns("username").ToString
                                    .DataBind()
                                End With
                            Else
                                'SqlAction = "SELECT Allocated_to,count(File_No)cnt_business,File_Status,sum(Premium)Premium,CAST(DATENAME(month, Allocate_Dt) as char(3))Month_dt FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WHERE Allocated_to='" & Session("username") & "' group by File_Status,Allocated_to,CAST(DATENAME(month, Allocate_Dt) as char(3))"

                                'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                                'If MyDatable.Rows.Count > 0 Then
                                '    GD_N3.DataSource = MyDatable
                                '    GD_N3.DataBind()
                                '    MyDatable = Nothing
                                'Else
                                '    GD_N3.DataSource = Nothing
                                '    GD_N3.DataBind()
                                'End If
                                Panel2.Visible = False
                                Panel4.Visible = False
                                Panel5.Visible = False
                                P_A.Visible = False
                                'P6.Visible = False
                                L2.Visible = False
                                L4.Visible = False
                                P0.Visible = True
                            End If
                        End If
                    End If
                End If
            End If
        End If
    End Sub


#Region "Overal Graphs"
    Private Function MakeAnalysisTable() As Data.DataTable
        Dim namesTable As New Data.DataTable
        Dim DirColumn As Data.DataColumn

        DirColumn = New Data.DataColumn()
        DirColumn.DataType = Type.GetType("System.String")
        DirColumn.ColumnName = "Month"
        DirColumn.DefaultValue = ""
        namesTable.Columns.Add(DirColumn)

        DirColumn = New Data.DataColumn()
        DirColumn.DataType = Type.GetType("System.String")
        DirColumn.ColumnName = "PERC_PRODUCTION"
        DirColumn.DefaultValue = 0
        namesTable.Columns.Add(DirColumn)

        DirColumn = New Data.DataColumn()
        DirColumn.DataType = Type.GetType("System.String")
        DirColumn.ColumnName = "CNT_PERC_POLICY"
        DirColumn.DefaultValue = 0
        namesTable.Columns.Add(DirColumn)

        'DirColumn = New Data.DataColumn()
        'DirColumn.DataType = Type.GetType("System.String")
        'DirColumn.ColumnName = "ACTUAL"
        'DirColumn.DefaultValue = 0
        'namesTable.Columns.Add(DirColumn)

        'DirColumn = New Data.DataColumn()
        'DirColumn.DataType = Type.GetType("System.String")
        'DirColumn.ColumnName = "Totals"
        'DirColumn.DefaultValue = ""
        'namesTable.Columns.Add(DirColumn)

        MakeAnalysisTable = namesTable

        Return namesTable
    End Function
    Private Sub Overal_Level(ByVal user_id As String)
        Try
            GD_AL.DataSource = Nothing
            GD_AL.DataBind()
            Dim MyChart As New RadChart
            Dim Str, Str1, Str2 As String : Dim MyGraphTable As DataTable
            Dim Mytable As DataTable : Dim Mytable1 As DataTable : Dim Mytable2 As DataTable

            Dim Myfiles As Array
            Myfiles = {"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"}


            'MyGraphTable = MakeAnalysisTable()

            'For x As Integer = 0 To Myfiles.Length - 1
            '    Dim MyDatarow As Data.DataRow = MyGraphTable.NewRow
            '    Dim MyDatarow_1 As Data.DataRow = MyGraphTable.NewRow
            '    Select Case Myfiles(x)
            '        Case "Jan"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jan'"
            '                    Str1 = "SELECT round(CNT_PERC_POLICY,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jan'"

            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jan'"
            '                    Str1 = "SELECT round(CNT_PERC_POLICY,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jan'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jan'"
            '                    Str1 = "SELECT round(CNT_PERC_POLICY,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jan'"

            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Feb"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Feb'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Feb'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Feb'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Mar"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Mar'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Mar'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Mar'"
            '            End Select

            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Apr"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Apr'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Apr'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Apr'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "May"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='May'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='May'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='May'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Jun"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jun'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jun'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jun'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Jul"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jul'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jul'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Jul'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Aug"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Aug'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Aug'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Aug'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Sep"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Sep'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Sep'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Sep'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Oct"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Oct'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Oct'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Oct'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Nov"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Nov'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Nov'"

            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Nov'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case "Dec"
            '            Select Case Session("NAME")
            '                Case "RE"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Dec'"
            '                Case "CLASS"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Dec'"
            '                Case "NSM"
            '                    Str = "SELECT round(PERC_PRODUCTION,2) FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE ='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' and  CAST(DATENAME(month, MONTH_FROM) as char(3))='Dec'"
            '            End Select
            '            MyDatarow.Item("Month") = Myfiles(x)
            '        Case Else

            '            'do nothing
            '    End Select


            '    Mytable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            '    If Mytable.Rows.Count > 0 Then
            '        MyDatarow.Item("PERC_PRODUCTION") = Mytable.Rows(0).Item(0)
            '        MyGraphTable.Rows.Add(MyDatarow)
            '    End If
            '    Mytable = Nothing
            '    Mytable = TryCast(MyDBAction.DBAction(Str1, DataManagement.DBActionType.DataTable), Data.DataTable)
            '    If Mytable.Rows.Count > 0 Then
            '        MyDatarow_1.Item("CNT_PERC_POLICY") = Mytable.Rows(0).Item(0)
            '        MyGraphTable.Rows.Add(MyDatarow_1)
            '    End If

            '    Mytable = Nothing
            '    Mytable1 = Nothing
            '    Mytable2 = Nothing

            'Next
            'Select Case Session("NAME")
            '    Case "RE"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,MONTH_BUDGET,ACTUAL_PROD,PERC_PRODUCTION,CNT_TOTAL_POLICY, CNT_ACT_POLICY,CNT_PERC_POLICY FROM TBL_SALES_RE_SUMMARY_OVERAL  WHERE RE_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            '    Case "CLASS"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,MONTH_BUDGET,ACTUAL_PROD,PERC_PRODUCTION,CNT_TOTAL_POLICY, CNT_ACT_POLICY,CNT_PERC_POLICY FROM TBL_SALES_CLASS_SUMMARY_OVERAL  WHERE MGR_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            '    Case "NSM"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,MONTH_BUDGET,ACTUAL_PROD,PERC_PRODUCTION,CNT_TOTAL_POLICY, CNT_ACT_POLICY,CNT_PERC_POLICY FROM TBL_SALES_NSM_SUMMARY_MTD  WHERE NSM_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            'End Select
            'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            'If MyDatable.Rows.Count > 0 Then
            '    GD_N4.DataSource = MyDatable
            '    GD_N4.DataBind()
            '    MyDatable = Nothing
            'Else
            '    GD_N4.DataSource = Nothing
            '    GD_N4.DataBind()
            'End If

            'Select Case Session("NAME")
            '    Case "RE"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,RENEW_PERC_MED,RENEW_MEDICAL,ACTUAL_RENEW_MED,CNT_POLICY_MED,ACT_CNT_MED,CNT_PERC_MED FROM TBL_SALES_RE_SUMMARY_OVERAL WHERE RE_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            '    Case "CLASS"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,RENEW_PERC_MED,RENEW_MEDICAL,ACTUAL_RENEW_MED,CNT_POLICY_MED,ACT_CNT_MED,CNT_PERC_MED FROM TBL_SALES_CLASS_SUMMARY_OVERAL WHERE MGR_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            '    Case "NSM"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,RENEW_PERC_MED,RENEW_MEDICAL,ACTUAL_RENEW_MED,CNT_POLICY_MED,ACT_CNT_MED,CNT_PERC_MED FROM TBL_SALES_NSM_SUMMARY_MTD WHERE NSM_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            'End Select
            'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            'If MyDatable.Rows.Count > 0 Then
            '    GD_N1.DataSource = MyDatable
            '    GD_N1.DataBind()
            '    MyDatable = Nothing
            'Else
            '    GD_N1.DataSource = Nothing
            '    GD_N1.DataBind()
            'End If
            'Select Case Session("NAME")
            '    Case "RE"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,RENEW_PERC_NONMED,RENEW_NON_MEDICAL,ACTUAL_RENEW_NONMED,CNT_POLICY_NON,ACT_CNT_NON,CNT_PERC_NONMED FROM TBL_SALES_RE_SUMMARY_OVERAL  WHERE RE_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            '    Case "CLASS"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,RENEW_PERC_NONMED,RENEW_NON_MEDICAL,ACTUAL_RENEW_NONMED,CNT_POLICY_NON,ACT_CNT_NON,CNT_PERC_NONMED FROM TBL_SALES_CLASS_SUMMARY_OVERAL  WHERE MGR_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            '    Case "NSM"
            '        SqlAction = "SELECT CAST(DATENAME(month, MONTH_FROM) as char(3)) MON,RENEW_PERC_NONMED,RENEW_NON_MEDICAL,ACTUAL_RENEW_NONMED, CNT_POLICY_NON,ACT_CNT_NON,CNT_PERC_NONMED FROM TBL_SALES_NSM_SUMMARY_MTD  WHERE NSM_CODE='" & user_id & "' AND YEAR([MONTH_FROM])='" & lblyear.Text & "' order by MONTH_FROM"
            'End Select
            'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            'If MyDatable.Rows.Count > 0 Then
            '    GD_N2.DataSource = MyDatable
            '    GD_N2.DataBind()
            '    MyDatable = Nothing
            'Else
            '    GD_N2.DataSource = Nothing
            '    GD_N2.DataBind()
            'End If
            'Session("username") = "aanjejo"
            Select Case Session("NAME")

                Case "BPO"
                    SqlAction = "SELECT Business_type , SUM([Total_Registered])[Total_Registered],SUM([Not_Forwarded])[Not_Forwarded],SUM([Returned_NotForwarded])[Returned_NotForwarded],SUM([Not_Allocated])[Not_Allocated],SUM([Medical_UW])[Medical_UW],SUM([Declined])[Declined],SUM([Pricing])[Pricing],SUM([Waiting_Update])[Waiting_Update],SUM([Waiting_Payment])[Waiting_Payment],SUM([Not_Receipted])[Not_Receipted],SUM([Receipted])[Receipted]  FROM   [CRM].[dbo].[TBL_MIS_CRM_TRACKING_SUMMARY_ALLOCATED]  WHERE [Allocated_to] ='" & Session("username") & "'   GROUP BY  [Entry_Yr] ,Business_type having SUM([Waiting_Update])<>0"
            End Select
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_AL.DataSource = MyDatable
                GD_AL.DataBind()
                MyDatable = Nothing
                P_A.Visible = True
            Else
                GD_AL.DataSource = Nothing
                GD_AL.DataBind()
            End If
            'RadChart1.PlotArea.YAxis.YAxisType = ChartYAxisType.Primary
            'RadChart1.PlotArea.XAxis.DataLabelsColumn = "Month"
            'RadChart1.AutoLayout = True
            'RadChart1.DataSource = MyGraphTable BPO
            'RadChart1.DataBind()
            MyGraphTable = Nothing

        Catch ex As Exception
            LblErr.Text = ex.Message.ToString
            'Panel4.Visible = True
            MyDBAction.DoLogs("Class==Welcome.vb: Private Sub Enrichment_Level()" & " : Error : " & ex.Message)
        End Try
    End Sub
#End Region

    Sub Region_Click(ByVal sender As Object, ByVal args As RegionClickEventArgs)
        Dim logFormat As String = "Item Class:{0} - ""{1}""" + Environment.NewLine
        If TypeOf sender Is ChartTitle Then
            LblErr.Text += [String].Format(logFormat, sender.[GetType]().Name, (TryCast(sender, ChartTitle)).TextBlock.Text)
        ElseIf TypeOf sender Is ChartSeriesItem Then
            LblErr.Text += [String].Format(logFormat, sender.[GetType]().Name, (TryCast(sender, ChartSeriesItem)).Name)
        End If
    End Sub



 
End Class

