Imports System.Data
Imports System.Data.OleDb
Imports System.Data.SqlClient
Imports System.IO
Imports System.Web.Configuration
Imports DocManage
Imports DocManage.DataManagement
Imports Mymail
Imports NPOI.Util
Imports Telerik.Web.UI
Partial Class Default2
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""
    Dim SqlAction As String = ""
    Dim MyDatatable As DataTable : Dim Str As String
    Dim AB As Integer
    Dim MailSent As Boolean = False
    Dim email As New Mail

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not Me.IsPostBack Then
            Try
                Me.Session("CODED") = 0
                Me.dtreceive.DbSelectedDate = DateTime.Now
                Me.dtcontract.DbSelectedDate = DateTime.Now
                Me.Session("empcode") = Nothing
                Me.Session("agentemail") = Nothing
                Me.Session("med") = 0
                Me.Session("Allocate") = 0
                Me.Session("INVOICED") = 0
                Me.lblIM.Text = ""
                Me.HiddenField1.Value = 0
                Me.HiddenField2.Value = 0
                Me.SqlAction = "SELECT emp_code FROM SALES.dbo.employees where  UserName='" & Me.Session("username") & "'"
                Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If Me.MyDatable.Rows.Count > 0 Then
                    Me.empno.Text = Me.MyDatable.Rows(0)("emp_code").ToString()
                End If
                Me.Str = "SELECT  [TITLE_CODE],[NAME]  from [DB_MASTER_AGENTS].[dbo].[TBL_MIS_AGENTS_TYPE]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbotype As RadComboBox = Me.cbotype
                cbotype.Items.Clear()
                cbotype.DataSource = Me.MyDatatable
                cbotype.DataTextField = Me.MyDatatable.Columns("NAME").ToString()
                cbotype.DataValueField = Me.MyDatatable.Columns("TITLE_CODE").ToString()
                cbotype.DataBind()

                Me.Str = "SELECT [REGION_CODE],[REGION_NAME] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_REGION] WHERE VALID_TO>=GETDATE()"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboregion As RadComboBox = Me.cboregion
                cboregion.Items.Clear()
                cboregion.DataSource = Me.MyDatatable
                cboregion.DataTextField = Me.MyDatatable.Columns("REGION_NAME").ToString()
                cboregion.DataValueField = Me.MyDatatable.Columns("REGION_CODE").ToString()
                cboregion.DataBind()

                Me.Str = "SELECT DISTINCT M.UNIT_CODE,UM_NAME +'  ('+ U.UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] U ON M.UNIT_CODE=U.UNIT_CODE WHERE IS_BDM=1 AND UM_NAME<>''"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbosalesMgr As RadComboBox = Me.cbosalesMgr
                cbosalesMgr.Items.Clear()
                cbosalesMgr.DataSource = Me.MyDatatable
                cbosalesMgr.DataTextField = Me.MyDatatable.Columns("UM_NAME").ToString()
                cbosalesMgr.DataValueField = Me.MyDatatable.Columns("UNIT_CODE").ToString()
                cbosalesMgr.DataBind()

                Me.Str = " SELECT DISTINCT M.GI_UNIT_CODE,GI_UM_NAME +'  ('+ U.GI_UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_GI_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_GI_UNITS] U ON M.GI_UNIT_CODE=U.GI_UNIT_CODE WHERE  GI_UM_NAME<>''"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbosalesgi As RadComboBox = Me.cbosalesgi
                cbosalesgi.Items.Clear()
                cbosalesgi.DataSource = Me.MyDatatable
                cbosalesgi.DataTextField = Me.MyDatatable.Columns("UM_NAME").ToString()
                cbosalesgi.DataValueField = Me.MyDatatable.Columns("GI_UNIT_CODE").ToString()
                cbosalesgi.DataBind()
                Me.chkname.Enabled = False
                Me.chkname.Checked = False
                Me.txtnEW.Enabled = False
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Private Function LastDayOfYear(ByVal d As Integer) As DateTime
        Dim time As New DateTime((d + 1), 1, 1)
        Return time.AddDays(-1)
    End Function
    Private Function firstDayOfYear(ByVal d As Integer) As DateTime
        Dim time As New DateTime(d, 1, 1)
        Return time
    End Function
    Public Sub LoadGrid(ByVal Ref_no As String)
        Try
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()

            GD_DIRE.DataSource = Nothing
            GD_DIRE.DataBind()

            '  SELECT emp_code FROM SALES.dbo.employees where  user_name=

            SqlAction = "SELECT [Note_id],[Ref_No],[Notes],[Note_From],[Note_Date]   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_AGENTS_NOTES] WHERE  Ref_No ='" & Ref_no & "'  ORDER BY Note_id DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
                MyDatable = Nothing
            Else
                GDNOTES.DataSource = Nothing
                GDNOTES.DataBind()
            End If




            MyDatable = Nothing
            SqlAction = "SELECT  [ID],[REF_NO],[NAME],[EMAIL],[MOBILE_NO],[NID_NO],[PIN_NO] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_DIRECTORS] WHERE   Ref_No ='" & Ref_no & "' AND IS_ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DIRE.DataSource = MyDatable
                GD_DIRE.DataBind()
                MyDatable = Nothing
            Else
                GD_DIRE.DataSource = Nothing
                GD_DIRE.DataBind()
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
  
    Protected Sub GDSEARCH_1_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDSEARCH_1.PageIndexChanged
        GDSEARCH_1.CurrentPageIndex = e.NewPageIndex
        GDSEARCH_1.DataSource = Session("DAD_CODE")
        GDSEARCH_1.DataBind()
    End Sub
    Protected Sub cmdsave_Click(sender As Object, e As System.EventArgs) Handles cmdsave.Click
        Try
            Dim name_changed As String = ""
            Dim integrated As Integer = 0
            If cbosalesMgr.SelectedValue = "" Then
                lblerr.Text = "Select Sales Manager"
                Exit Sub
            End If
            If cboregion.SelectedValue = "" Then
                lblerr.Text = "Select Region"
                Exit Sub
            End If
            If chkname.Checked = True Then
                name_changed = "Yes"
            Else
                name_changed = "No"
            End If

            If chketims.Checked = True Then
                integrated = 1
            Else
                integrated = 0
            End If
 
                If lblfile.Text = "" Then
                    lblerr.Text = "Select File Number"
                    Exit Sub
                End If
            If chkname.Checked = True Then
                SqlAction = "select [Admin_Name] from [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_ADMINS]  where [Name_Change]=1 and [MIS_Emp_Code]='" & empno.Text & "' "
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    MyDBAction.NameChange(lblfile.Text, Trim(txtnEW.Text.ToUpper), Session("username"))
                    MyDBAction.MIS_SALES_INTERMEDIARY(lblfile.Text, Trim(txtnEW.Text.ToUpper), cbotype.SelectedValue, cbosalesMgr.SelectedValue, cboregion.SelectedValue, txtrate.Text, txtemail.Text, txtMobile.Text, txtpin.Text, txtMobile2.Text, cbofreq.SelectedValue, Session("UserName").ToString, CDate(dtreceive.DbSelectedDate).ToString("yyyy-MM-dd"), txtid.Text, CDate(dtcontract.DbSelectedDate).ToString("yyyy-MM-dd"), txtPayroll.Text, txtagentno.Text, name_changed, integrated, Me.cbosalesgi.SelectedValue)
                Else
                    lblerr.Text = "You not Allowed to change Name"
                    Exit Sub
                End If
            Else
                MyDBAction.MIS_SALES_INTERMEDIARY(lblfile.Text, Trim(txtname.Text.ToUpper), cbotype.SelectedValue, cbosalesMgr.SelectedValue, cboregion.SelectedValue, txtrate.Text, txtemail.Text, txtMobile.Text, txtpin.Text, txtMobile2.Text, cbofreq.SelectedValue, Session("UserName").ToString, CDate(dtreceive.DbSelectedDate).ToString("yyyy-MM-dd"), txtid.Text, CDate(dtcontract.DbSelectedDate).ToString("yyyy-MM-dd"), txtPayroll.Text, txtagentno.Text, name_changed, integrated, Me.cbosalesgi.SelectedValue)
            End If
            'End If

            lblerr.Text = "Saved Successful!"
            SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],AGENT_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO='" & Trim(lblfile.Text) & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()
                'Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If

            txtname.Text = ""
            cbotype.SelectedValue = ""
            cbosalesMgr.SelectedValue = ""
            cboregion.SelectedValue = ""
            txtrate.Text = ""
            txtemail.Text = ""
            txtMobile.Text = ""
            txtpin.Text = ""
            txtMobile2.Text = ""
            cbofreq.SelectedValue = ""

            chkname.Checked = False
            HiddenField1.Value = 0
            txtid.Text = ""
            dtcontract.DbSelectedDate = Date.Now
            txtPayroll.Text = ""
            txtagentno.Text = ""
            dtreceive.DbSelectedDate = Date.Now



        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
 
  
    Protected Sub cmdedit_Click(sender As Object, e As System.EventArgs) Handles cmdedit.Click
        HiddenField1.Value = 1

        Me.txtname.Enabled = False
        Me.cbotype.Enabled = True
        Me.cbosalesMgr.Enabled = True
        Me.cboregion.Enabled = True
        Me.txtrate.Enabled = True
        Me.txtemail.Enabled = True
        Me.txtMobile.Enabled = True
        Me.txtpin.Enabled = True
        Me.txtMobile2.Enabled = True
        Me.cbofreq.Enabled = True
        Me.txtagentno.Enabled = True
        Me.txtPayroll.Enabled = True
        Me.chkname.Enabled = True
        Me.cbosalesgi.Enabled = True
        Me.txtid.Enabled = True
        Me.txtagentno.Enabled = False

    End Sub

    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Try
            If cbosearch.SelectedValue = "N" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE,[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_NAME LIKE '%" & Trim(txtsearch.Text.ToUpper) & "%'"

            ElseIf cbosearch.SelectedValue = "A" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE, [AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE  AGENT_CODE = '" & Trim(txtsearch.Text.ToUpper) & "'"

                'ElseIf cbosearch.SelectedValue = "R" Then
                '    SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS], Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO = '" & Trim(txtsearch.Text.ToUpper) & "'"

            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE,[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS], Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE PAYROL_NO = '" & txtsearch.Text.ToUpper & "'"

            End If
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If
        Catch ex As Exception
            'lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub cboregion_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboregion.SelectedIndexChanged
        Try
            cbosalesMgr.Items.Clear()
            'Str = "SELECT DISTINCT M.UNIT_CODE,UM_NAME +'  ('+ U.UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] U ON M.UNIT_CODE=U.UNIT_CODE WHERE  VALID_TO>=GETDATE() and M.UNIT_CODE in (SELECT UNIT_CODE FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] WHERE REGION_CODE='" & cboregion.SelectedValue & "') AND UM_NAME<>''"

            Str = "SELECT DISTINCT M.UNIT_CODE,UM_NAME +'  ('+ U.UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] U ON M.UNIT_CODE=U.UNIT_CODE WHERE  M.VALID_TO>=GETDATE() and M.UNIT_CODE in (SELECT UNIT_CODE FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] WHERE REGION_CODE='" & cboregion.SelectedValue & "') AND UM_NAME<>''" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbosalesMgr
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("UM_NAME").ToString
                .DataValueField = MyDatatable.Columns("UNIT_CODE").ToString
                .DataBind()
            End With
        Catch ex As Exception

        End Try
    End Sub

    Protected Sub GDSEARCH_1_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDSEARCH_1.SelectedIndexChanged
        Try
            Me.Session("email") = ""
            Me.Session("email_cc") = ""
            Me.Session("CODED") = 0
            Me.lblfile.Text = CType(Me.GDSEARCH_1.SelectedItems(0), GridDataItem).GetDataKeyValue("AGENT_CODE").ToString()
            Me.SqlAction = "SELECT USER_ID,CODED,Licence_No, REF_NO,AGENT_NAME,HIER_NAME,AGENT_TYPE,AGENT_CODE,COMMISSION_RATE, UNIT_CODE,REGION_CODE,SALES_TAX,COMMISSION_RATE,EMAIL,MOBILE_NO,PIN_NO,SEC_MOBILE_NO,EARN_COMMISSION,H_TAX,NSM_CODE,PAY_MODE,ACTIVE,Receive_Date,NID_NO,HRMIS_CODE,Contract_Date,[ETIMS_VERIFIED],GI_CODE FROM[DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE Agent_Code='" + Me.lblfile.Text + "'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.dtreceive.DbSelectedDate = Me.MyDatable.Rows(0)("Receive_Date").ToString()
                Me.txtname.Text = Me.MyDatable.Rows(0)("AGENT_NAME").ToString()
                Me.cbotype.SelectedValue = Me.MyDatable.Rows(0)("AGENT_TYPE").ToString()
                Me.cbosalesMgr.SelectedValue = Me.MyDatable.Rows(0)("UNIT_CODE").ToString()
                Me.cboregion.SelectedValue = Me.MyDatable.Rows(0)("REGION_CODE").ToString()
                Me.cbosalesgi.SelectedValue = Me.MyDatable.Rows(0)("GI_CODE").ToString()
                Me.txtrate.Text = Me.MyDatable.Rows(0)("COMMISSION_RATE").ToString()
                Me.txtemail.Text = Me.MyDatable.Rows(0)("EMAIL").ToString()
                Me.txtMobile.Text = Me.MyDatable.Rows(0)("MOBILE_NO").ToString()
                Me.txtpin.Text = Me.MyDatable.Rows(0)("PIN_NO").ToString()
                Me.txtMobile2.Text = Me.MyDatable.Rows(0)("SEC_MOBILE_NO").ToString()
                Me.cbofreq.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()
                Me.txtid.Text = Me.MyDatable.Rows(0)("NID_NO").ToString()
                Me.txtagentno.Text = Me.MyDatable.Rows(0)("AGENT_CODE").ToString()
                Me.txtPayroll.Text = Me.MyDatable.Rows(0)("HRMIS_CODE").ToString()
                Me.dtcontract.DbSelectedDate = Me.MyDatable.Rows(0)("Contract_Date").ToString()
                Me.lblfile.Text = Me.MyDatable.Rows(0)("Ref_No").ToString()
                Me.Session("CODED") = Me.MyDatable.Rows(0)("CODED").ToString()
                Me.SqlAction = "SELECT AGENT_NAME, AGENT_EMAIL,UM_EMAIL FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_CODE='" + Strings.Trim(Me.lblfile.Text) + "'"
                Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If Me.MyDatable.Rows.Count > 0 Then
                    Me.Session("email") = Me.MyDatable.Rows(0)("AGENT_EMAIL").ToString()
                    Me.Session("email_cc") = Me.MyDatable.Rows(0)("UM_EMAIL").ToString()
                End If
                Me.MyDatable = Nothing
                Me.LoadGrid(Me.lblfile.Text)
            Else
                Me.GDSEARCH_1.DataSource = Nothing
                Me.GDSEARCH_1.DataBind()
            End If
            Me.HiddenField1.Value = 1
            Me.txtname.Enabled = False
            Me.cbotype.Enabled = False
            Me.cbosalesMgr.Enabled = False
            Me.cboregion.Enabled = False
            Me.txtrate.Enabled = False
            Me.txtemail.Enabled = False
            Me.txtMobile.Enabled = False
            Me.txtpin.Enabled = False
            Me.txtMobile2.Enabled = False
            Me.cbofreq.Enabled = False
            Me.txtid.Enabled = False
            Me.dtreceive.Enabled = False
            Me.cbosalesgi.Enabled = False
            Me.dtcontract.Enabled = False
        Catch ex As Exception
        End Try
    End Sub
    


    Protected Sub RadButton3_Click(sender As Object, e As System.EventArgs) Handles RadButton3.Click
        Try
            If HiddenField2.Value = 0 Then
                MyDBAction.Add_Directors(lblfile.Text, Trim(txtdir.Text.ToUpper), txtdiremail.Text, txtdirmob.Text, txtdireid.Text, txtdirepin.Text, Session("username"), HiddenField2.Value)
            Else
                MyDBAction.Add_Directors(lblfile.Text, Trim(txtdir.Text.ToUpper), txtdiremail.Text, txtdirmob.Text, txtdireid.Text, txtdirepin.Text, Session("username"), HiddenField2.Value)
            End If

            SqlAction = "SELECT  [ID],[REF_NO],[NAME],[EMAIL],[MOBILE_NO],[NID_NO],[PIN_NO] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_DIRECTORS] WHERE   Ref_No ='" & lblfile.Text & "' AND IS_ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DIRE.DataSource = MyDatable
                GD_DIRE.DataBind()
                MyDatable = Nothing
            Else
                GD_DIRE.DataSource = Nothing
                GD_DIRE.DataBind()
            End If
            lbldir.Text = "Saved Successfull!"
            txtdir.Text = ""
            txtdiremail.Text = ""
            txtdirmob.Text = ""
            txtdireid.Text = ""
            txtdirepin.Text = ""
            HiddenField2.Value = 0
        Catch ex As Exception
            lbldir.Text = ex.Message
        End Try
    End Sub


    Protected Sub GD_DIRE_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_DIRE.SelectedIndexChanged
        Try
            Dim id As Integer
            HiddenField2.Value = (DirectCast(GD_DIRE.SelectedItems(0), GridDataItem)).GetDataKeyValue("ID").ToString()

            SqlAction = "SELECT  [ID],[REF_NO],[NAME],[EMAIL],[MOBILE_NO],[NID_NO],[PIN_NO] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_DIRECTORS] WHERE ID='" & HiddenField2.Value & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                txtdir.Text = MyDatable.Rows(0).Item("NAME").ToString()
                txtdireid.Text = MyDatable.Rows(0).Item("NID_NO").ToString()
                txtdiremail.Text = MyDatable.Rows(0).Item("EMAIL").ToString()
                txtdirepin.Text = MyDatable.Rows(0).Item("PIN_NO").ToString()
                txtdirmob.Text = MyDatable.Rows(0).Item("MOBILE_NO").ToString()

            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)
    End Sub


    Protected Sub chkname_CheckedChanged(sender As Object, e As System.EventArgs) Handles chkname.CheckedChanged
        If chkname.Checked = True Then
            txtnEW.Enabled = True
        Else
            txtnEW.Enabled = False
        End If

    End Sub

End Class
