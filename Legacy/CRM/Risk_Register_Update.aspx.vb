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
                Session("Department") = ""
                dtduedate.DbSelectedDate = Date.Now()
                Str = "SELECT emp_code FROM employees  where username='" & Session("username") & "'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    emp_code = MyDatatable.Rows(0).Item("emp_code").ToString
                    emp_code = "0499"
                End If

                Str = "SELECT  [Emp_Code],Champion_Name,Department   FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_CHAMPS] where Emp_Code='" & emp_code & "'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Department = MyDatatable.Rows(0).Item("Department").ToString
                End If

                Str = "select code,Category_Name  from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_CATEGORY]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbocategory
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Category_Name").ToString
                    .DataValueField = MyDatatable.Columns("code").ToString
                    .DataBind()
                End With

                Str = "SELECT  [Status]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ACTION_STATUS] where  Is_Active=1" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbostatus
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Status").ToString
                    .DataValueField = MyDatatable.Columns("Status").ToString
                    .DataBind()
                End With
                'With cboriskstatus
                '    .Items.Clear()
                '    .DataSource = MyDatatable
                '    .DataTextField = MyDatatable.Columns("Status").ToString
                '    .DataValueField = MyDatatable.Columns("Status").ToString
                '    .DataBind()
                'End With

                Str = "select Likelihood_Code,Likelihood_factor from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_LIKELYHOOD]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbolikely
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Likelihood_factor").ToString
                    .DataValueField = MyDatatable.Columns("Likelihood_Code").ToString
                    .DataBind()
                End With

                Str = "select Impact_code,Impact_factor from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_IMPACT]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboimpact
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Impact_factor").ToString
                    .DataValueField = MyDatatable.Columns("Impact_code").ToString
                    .DataBind()
                End With
                Str = "select Owner_Code,Owner_Name from  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OWNER] where Department  ='" & Department & "' " '"
                'Str = "select Owner_Code,Owner_Name from  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OWNER]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboowner
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Owner_Name").ToString
                    .DataValueField = MyDatatable.Columns("Owner_Code").ToString
                    .DataBind()
                End With
                Str = "select code,Obj_Name	 from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OBJE] where Depart_code ='" & Department & "' " '"
                'Str = "select DISTINCT code,Obj_Name	 from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OBJE]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboobjective
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Obj_Name").ToString
                    .DataValueField = MyDatatable.Columns("code").ToString
                    .DataBind()
                End With

                Str = "select Eff_factor  from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_CONTROL_EFF]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbopercieved
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Eff_factor").ToString
                    .DataValueField = MyDatatable.Columns("Eff_factor").ToString
                    .DataBind()
                End With
                Str = "select Eff_factor  from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_CONTROL_EFF]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbodesired
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Eff_factor").ToString
                    .DataValueField = MyDatatable.Columns("Eff_factor").ToString
                    .DataBind()
                End With

                LOAD_DEPART(Department)
                FILE_NO.Text = Department

                cboobjective.Enabled = False
                txttitle.Enabled = False
                cbocategory.Enabled = False
                txtdescr.Enabled = False
                txtroot.Enabled = False
                txtconseq.Enabled = False
                cboimpact.Enabled = False
                cbolikely.Enabled = False
                'cboinhe.Enabled = False
                txtcurrcont.Enabled = False
                cbopercieved.Enabled = False
                cbodesired.Enabled = False
                'cboResidual.Enabled = False
                txtmitigation.Enabled = False
                dtduedate.Enabled = False
                txtowner.Text = False
                cbostatus.Enabled = False
                chkactive.Enabled = False
                LBLRISK.Enabled = False
                'btnsave.Enabled = False
                btnedit.Enabled = True

            Catch ex As Exception
                lblsave.Text = ex.Message
            End Try
        End If
    End Sub
    
    Protected Sub GD_RISK_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_RISK.PageIndexChanged
        GD_RISK.CurrentPageIndex = e.NewPageIndex
        GD_RISK.DataSource = Session("DEP_01")
        GD_RISK.DataBind()
    End Sub

    Public Sub LOAD_DEPART(ByVal depart As String)
        'SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE Status='OPEN' and [Submitted]=0"
        SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE Status='OPEN' and [Submitted]=0 and Depart_Code='" & Department & "'"
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
    Public Sub LoadGrid(ByVal depart As String)
        'GD_RISK_1.DataSource = Nothing
        'GD_RISK_1.DataBind()
        GD_RISK.DataSource = Nothing
        GD_RISK.DataBind()
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        GD_RISK_SUM.DataSource = Nothing
        GD_RISK_SUM.DataBind()
        GD_RISK_1.DataSource = Nothing
        GD_RISK_1.DataBind()
        SqlAction = "SELECT [Risk_Id],[Depart_Objective],[Risk_Title],[Risk_Category],[Risk_Impact],[Risk_Likelihood],[Due_Date],[Action_Owner],[Action_Status] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and update_status=0  and submitted=0 order by Depart_Objective"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK.DataSource = MyDatable
            GD_RISK.DataBind()
            Session("DEP_01") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK.DataSource = Nothing
            GD_RISK.DataBind()
        End If

        SqlAction = "SELECT [Risk_Id],[Depart_Objective],[Risk_Title],[Risk_Category],[Risk_Impact],[Risk_Likelihood],[Due_Date],[Action_Owner],[Action_Status] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE depart_code='" & FILE_NO.Text & "' and    PERIOD_FROM='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and update_status=1  and submitted=0 and reviewed=0 order by Depart_Objective"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_1.DataSource = MyDatable
            GD_RISK_1.DataBind()
            Session("DEP_01") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK_1.DataSource = Nothing
            GD_RISK_1.DataBind()
        End If


        GD_RISK_SUM.DataSource = Nothing
        GD_RISK_SUM.DataBind()
        SqlAction = "SELECT [IR_Ranking],[Depart_Code],[Period_From],[Period_To],Risk_Code,[Title_Reference],[Impact],[Likelihood],[Inh_Risk_Exposure],[Control_Eff],[R_Risk_Exposure] FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER_SUMMARY] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'    order by R_Risk_Exposure desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_SUM.DataSource = MyDatable
            GD_RISK_SUM.DataBind()
            Session("DEP_02") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK_SUM.DataSource = Nothing
            GD_RISK_SUM.DataBind()
        End If

        SqlAction = "SELECT [Note_id],[Risk_Code],[Notes_by] ,[Note_date],[Notes]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_NOTES] WHERE  Risk_Code ='" & depart & "' and Period_From='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' ORDER BY Note_id DESC"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDNOTES.DataSource = MyDatable
            GDNOTES.DataBind()
            MyDatable = Nothing
        Else
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
        End If

    End Sub

    Protected Sub GDDEPART_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDDEPART.SelectedIndexChanged
        Try
            Session("File") = Nothing
            GD_RISK_SUM.DataSource = Nothing
            GD_RISK_SUM.DataBind()
            HiddenField1.Value = (DirectCast(GDDEPART.SelectedItems(0), GridDataItem)).GetDataKeyValue("Id").ToString()
            SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE ID='" & HiddenField1.Value & "' AND STATUS='OPEN'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("Depart_Code").ToString()
                Session("File") = MyDatable.Rows(0).Item("Depart_Code").ToString()
                dtfrom.DbSelectedDate = MyDatable.Rows(0).Item("Period_From").ToString()
                dtto.DbSelectedDate = MyDatable.Rows(0).Item("Period_To").ToString()
                cboowner.SelectedValue = MyDatable.Rows(0).Item("Risk_Owner").ToString()

                Str = "select [Email] from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OWNER] WHERE [Department]='" & FILE_NO.Text & "' and active=1" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email") = MyDatatable.Rows(0).Item("Email").ToString()
                End If
                LoadGrid(FILE_NO.Text)
            End If
        Catch ex As Exception
            lblsave.Text = ex.Message
        End Try
    End Sub
    Public Sub Generate_Task()
        Dim AB As Integer
        SqlAction = "SELECT ISNULL((MAX(Risk_Id)+1),1) NUMBER FROM  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER]"
        MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatatable.Rows.Count > 0 Then
            AB = MyDatatable.Rows(0).Item("NUMBER").ToString()
            Dim numStr4ch As String = Strings.Right("00" & AB.ToString(), 3)
            LBLRISK.Text = "FIN" & "-R" & numStr4ch + ""
        End If

    End Sub
    Protected Sub btnedit0_Click(sender As Object, e As System.EventArgs) Handles btnsave.Click
        Try
            Dim active = 0
            If chkactive.Checked = True Then
                active = 1
            Else
                active = 0
            End If
          
         
            If FILE_NO.Text = "" Then
                lblsave.Text = "Select Department!"
                Exit Sub
            End If
            If HiddenField1.Value = 0 Then
                Generate_Task()
                MyDBAction.update_register(FILE_NO.Text, LBLRISK.Text, CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd"), cboobjective.SelectedValue, txttitle.Text, txtdescr.Text, cbocategory.SelectedValue, "", txtconseq.Text, cboimpact.SelectedValue, 0, cbolikely.SelectedValue, 0, "", 0, "", cbopercieved.SelectedValue, 0, cbodesired.SelectedValue, 0, "", active, "", "", "", "", Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), 0)
            Else
                MyDBAction.update_register(FILE_NO.Text, LBLRISK.Text, CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd"), cboobjective.SelectedValue, txttitle.Text, txtdescr.Text, cbocategory.SelectedValue, "", txtconseq.Text, cboimpact.SelectedValue, 0, cbolikely.SelectedValue, 0, "", 0, "", cbopercieved.SelectedValue, 0, cbodesired.SelectedValue, 0, "", active, "", "", "", "", Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), 1)
            End If
            If txtnotes.Text <> "" Then
                MyDBAction.TRACKING_RISK_NOTES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtnotes.Text, CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd"))
            End If

            MyDBAction.Compute_Risk_Values(FILE_NO.Text, LBLRISK.Text, CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd"))
            lblsave.Text = "Updated Successful!"
            LoadGrid(FILE_NO.Text)


            cboobjective.SelectedValue = ""
            txttitle.Text = ""
            cbocategory.SelectedValue = ""
            txtdescr.Text = ""
            txtroot.Text = ""
            txtconseq.Text = ""
            cboimpact.SelectedValue = ""
            cbolikely.SelectedValue = ""
            'cboinhe.SelectedValue = ""
            txtcurrcont.Text = ""
            cbopercieved.SelectedValue = ""
            cbodesired.SelectedValue = ""
            'cboResidual.SelectedValue = ""
            txtmitigation.Text = ""
            'dtduedate.DbSelectedDate = MyDatable.Rows(0).Item("Due_Date").ToString()

            txtowner.Text = ""
            cbostatus.SelectedValue = ""
            cbostatus.Text = ""
            txtnotes.Text = ""
            chkactive.Checked = False
            LBLRISK.Text = ""
            'btnsave.Enabled = False
        Catch ex As Exception
            lblsave.Text = ex.Message
        End Try
    End Sub

    Protected Sub GD_RISK_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_RISK.SelectedIndexChanged
        Try
            Dim Risk_Id As Integer
            HiddenField1.Value = 1
            HiddenField2.Value = 0
            rootid.Text = ""
            GD_RISK_ROOT.DataSource = Nothing
            GD_RISK_ROOT.DataBind()
            Risk_Id = (DirectCast(GD_RISK.SelectedItems(0), GridDataItem)).GetDataKeyValue("Risk_Id").ToString()
            SqlAction = "SELECT [Risk_Id],[Depart_Code],[Risk_Code],[Period_From],[Period_To],[Depart_Objective],[Risk_Title],[Risk_Descr],[Risk_Category],[Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by],[Update_date],[Submitted],[Reviewed],[Reviewed_by],[Update_Status]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER] WHERE  Risk_Id='" & Risk_Id & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("Depart_Code").ToString()
                cboobjective.SelectedValue = MyDatable.Rows(0).Item("Depart_Objective").ToString()
                txttitle.Text = MyDatable.Rows(0).Item("Risk_Title").ToString()
                cbocategory.SelectedValue = MyDatable.Rows(0).Item("Risk_Category").ToString()
                txtdescr.Text = MyDatable.Rows(0).Item("Risk_Descr").ToString()
                txtconseq.Text = MyDatable.Rows(0).Item("Risk_Conseq").ToString()
                cboimpact.SelectedValue = MyDatable.Rows(0).Item("Risk_Impact").ToString()
                cbolikely.SelectedValue = MyDatable.Rows(0).Item("Risk_Likelihood").ToString()
                'cboinhe.SelectedValue = MyDatable.Rows(0).Item("I_Risk_Exposure").ToString()

                cbopercieved.SelectedValue = MyDatable.Rows(0).Item("Perceived_Contr_Eff").ToString()
                cbodesired.SelectedValue = MyDatable.Rows(0).Item("Desired_Contr_Effe").ToString()
                'cboResidual.SelectedValue = MyDatable.Rows(0).Item("R_Risk_Exposure").ToString()
               
                'cboriskstatus.SelectedValue = MyDatable.Rows(0).Item("Action_Status").ToString()
                chkactive.Checked = MyDatable.Rows(0).Item("Is_active").ToString()
                LBLRISK.Text = MyDatable.Rows(0).Item("Risk_Code").ToString()

                Load_Root(LBLRISK.Text)

                cboobjective.Enabled = False
                txttitle.Enabled = False
                cbocategory.Enabled = False
                txtdescr.Enabled = False
                txtroot.Enabled = True
                txtconseq.Enabled = False
                cboimpact.Enabled = False
                cbolikely.Enabled = False
                'cboinhe.Enabled = False
                txtcurrcont.Enabled = True
                cbopercieved.Enabled = False
                cbodesired.Enabled = False
                'cboResidual.Enabled = False
                txtmitigation.Enabled = True
                dtduedate.Enabled = True
                txtowner.Text = True
                cbostatus.Enabled = True
                chkactive.Enabled = False
                LBLRISK.Enabled = False
                'btnsave.Enabled = False
                btnedit.Enabled = True

            End If


        Catch ex As Exception

        End Try
    End Sub

    Protected Sub btnedit_Click(sender As Object, e As System.EventArgs) Handles btnedit.Click
        HiddenField1.Value = 1
        lblsave.Text = ""
        cboobjective.Enabled = True
        txttitle.Enabled = True
        cbocategory.Enabled = True
        txtdescr.Enabled = True
        txtroot.Enabled = True
        txtconseq.Enabled = True
        cboimpact.Enabled = True
        cbolikely.Enabled = True
        'cboinhe.Enabled = True
        txtcurrcont.Enabled = True
        cbopercieved.Enabled = True
        cbodesired.Enabled = True
        'cboResidual.Enabled = True
        txtmitigation.Enabled = True
        dtduedate.Enabled = True
        txtowner.Text = True
        cbostatus.Enabled = True
        chkactive.Enabled = True
        LBLRISK.Enabled = True
        btnsave.Enabled = True
        btnedit.Enabled = True

    End Sub

    Protected Sub GD_RISK_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GD_RISK.NeedDataSource

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        Try


            SqlAction = "SELECT [Risk_Id] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and update_status=0  and submitted=0 order by Depart_Objective"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblsubmit.Text = "You Must update all Risks!"
                Exit Sub
            End If



            UpdateRecord(" UPDATE [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] SET Status='SUBMITTED',  Submitted=1,Submit_date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',submit_By='" & Session("username") & "', Reviewed=0 WHERE   Depart_Code='" & FILE_NO.Text & "' and period_from='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND Submitted=0")
            UpdateRecord(" UPDATE [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER] SET  Submitted=1  WHERE     Depart_Code='" & FILE_NO.Text & "' AND PERIOD_FROM='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND  [Update_Status]=1")
            lblsubmit.Text = "Submitted Successful to :'" & cboowner.Text & "'"
            
            'Session("email") = "jmwaniki@aar.co.ke"
            Session("cc_email") = ""
            Session("Message") = "This is to inform you that Risk Register for the period between '" & dtfrom.DbSelectedDate & "' and '" & dtto.DbSelectedDate & "' has been updated and  ready for signoff"
            MailSent = SendLoginDetails(cboowner.Text, Session("email"), Session("cc_email"))

            FILE_NO.Text = ""
            dtfrom.DbSelectedDate = Date.Now
            LoadGrid(FILE_NO.Text)
            'LOAD_DEPART(FILE_NO.Text)
            FILE_NO.Text = ""
        Catch ex As Exception
            lblsubmit.Text = ex.Message
        End Try
    End Sub

    

    Protected Sub RadButton2_Click(sender As Object, e As System.EventArgs) Handles RadButton2.Click
        Try
            lblroot.Text = ""
            If LBLRISK.Text = "" Then
                lblroot.Text = "Select the Risk"
                Exit Sub
            End If

            If txtowner.Text = "" Then
                lblroot.Text = "Select the Risk Owner"
                Exit Sub
            End If
            If cbostatus.SelectedValue = "" Then
                lblroot.Text = "Select the Root Cause Status"
                Exit Sub
            End If
          
            If HiddenField2.Value = 0 Then
                MyDBAction.TRACKING_RISK_CAUSE(LBLRISK.Text, txtroot.Text, txtcurrcont.Text, txtmitigation.Text, CDate(dtduedate.DbSelectedDate).ToString("yyyy-MM-dd"), txtowner.Text, cbostatus.SelectedValue, Session("username"))
                lblroot.Text = "Saved Successfull"
                Load_Root(LBLRISK.Text)
            Else
                UpdateRecord("UPDATE [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ROOT_CAUSE] SET [Due_Date]='" & CDate(dtduedate.DbSelectedDate).ToString("yyyy-MM-dd") & "', Action_Owner='" & txtowner.Text & "', Action_Status='" & cbostatus.SelectedValue & "', Root_Cause='" & txtroot.Text & "', Current_Contr ='" & txtcurrcont.Text & "', Mitigations='" & txtmitigation.Text & "',[Update_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',[Updated_By]='" & Session("username") & "' WHERE   Root_ID='" & rootid.Text & "'")
                lblroot.Text = "Saved Successfull"
                Load_Root(LBLRISK.Text)
            End If
            rootid.Text = ""
            txtroot.Text = ""
            txtcurrcont.Text = ""
            txtmitigation.Text = ""
            dtduedate.DbSelectedDate = Date.Now()
            txtowner.Text = ""
            cbostatus.Text = ""

        Catch ex As Exception
            lblroot.Text = ex.Message
        End Try
    End Sub
    Private Sub Load_Root(ByVal str As String)
        SqlAction = "SELECT Root_id, [Risk_Code],[Root_Cause],[Current_Contr] ,[Mitigations],[Due_Date],Action_Owner,Action_Status  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ROOT_CAUSE] WHERE  Risk_Code ='" & str & "'"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_ROOT.DataSource = MyDatable
            GD_RISK_ROOT.DataBind()
            MyDatable = Nothing
        Else
            GD_RISK_ROOT.DataSource = Nothing
            GD_RISK_ROOT.DataBind()
        End If
    End Sub

     
    Protected Sub GD_RISK_ROOT_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_RISK_ROOT.SelectedIndexChanged
        Try
            HiddenField2.Value = 1

            rootid.Text = (DirectCast(GD_RISK_ROOT.SelectedItems(0), GridDataItem)).GetDataKeyValue("Root_ID").ToString()

            SqlAction = "SELECT  [Root_ID],[Risk_Code],[Root_Cause],[Current_Contr],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_By],[Update_Date]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ROOT_CAUSE] WHERE  Root_ID='" & rootid.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                txtroot.Text = MyDatable.Rows(0).Item("Root_Cause").ToString()
                'txtconseq.Text = MyDatable.Rows(0).Item("Risk_Conseq").ToString()
                txtcurrcont.Text = MyDatable.Rows(0).Item("Current_Contr").ToString()
                txtmitigation.Text = MyDatable.Rows(0).Item("Mitigations").ToString()
                dtduedate.DbSelectedDate = MyDatable.Rows(0).Item("Due_Date").ToString()
                txtowner.Text = MyDatable.Rows(0).Item("Action_Owner").ToString()
                cbostatus.SelectedValue = MyDatable.Rows(0).Item("Action_Status").ToString()
            End If
        Catch ex As Exception
            lblroot.Text = ex.Message
        End Try
    End Sub
    Protected Sub GD_RISK_SUM_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GD_RISK_SUM.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("R_Risk_Exposure")
            If myCell.Text > 40 Then
                dataItem.BackColor = Drawing.Color.Red

            ElseIf myCell.Text > 25 And myCell.Text <= 40 Then
                dataItem.BackColor = Drawing.Color.Orange

            ElseIf myCell.Text > 14 And myCell.Text <= 25 Then
                dataItem.BackColor = Drawing.Color.Yellow

            ElseIf myCell.Text > 6 And myCell.Text <= 14 Then
                dataItem.BackColor = Drawing.Color.LightYellow

            ElseIf myCell.Text > 0 And myCell.Text <= 6 Then
                dataItem.BackColor = Drawing.Color.LightGreen
                'ElseIf myCell.Text = "" Then
                '    dataItem.BackColor = Drawing.Color.CadetBlue

            End If

        End If
    End Sub
    Protected Sub GD_RISK_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GD_RISK.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            '
            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("Action_Status")
            If myCell.Text = "Behind schedule" Then
                dataItem.BackColor = Drawing.Color.Red
            ElseIf myCell.Text = "Closed" Then
                dataItem.BackColor = Drawing.Color.Green

            End If

        End If
    End Sub

    Public Function SendLoginDetails(ByVal EmployeeName As String, ByVal RecepientEmail As String, ByVal ccemail As String) As Boolean

        Dim MailSent As Boolean = False
        Dim strMailFromEmail As String = ""
        Dim strMailFromName As String = ""
        Dim MessageSubject As String = ""
        Dim MySqlAction As String = ""
        Dim MyDBAction As New DataManagement
        Dim MyDataTable As New Data.DataTable
        Dim MyEncryption As New SysSettsEncryption
        Dim LoginFromEmail As String = ""
        Dim LoginDisplayName As String = ""
        Dim LoginSubject As String = ""
        Dim EmailServer As String = ""
        Dim EmailUserName As String = ""
        Dim EmailPassword As String = ""
        Dim action As String = ""

        Try ''--Retrieve settings from db n decrypt - Mercy - 12th Apr 2011
            LoginFromEmail = System.Configuration.ConfigurationManager.AppSettings("LoginFromEmail").Trim()
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
            'LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
            LoginSubject = "RISK REGISTER-SIGNOFF"
            EmailServer = System.Configuration.ConfigurationManager.AppSettings("EmailServer").Trim()
            EmailUserName = System.Configuration.ConfigurationManager.AppSettings("EmailUsername").Trim()
            EmailPassword = System.Configuration.ConfigurationManager.AppSettings("EmailPassword").Trim()

            Dim strHTML As New StringBuilder
            strHTML = strHTML.Append("<!DOCTYPE html PUBLIC '-//W3C//DTD XHTML 1.0 Transitional//EN' 'http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd'>")
            strHTML = strHTML.Append("<html xmlns='http://www.w3.org/1999/xhtml' >")
            strHTML = strHTML.Append("<head>")
            strHTML = strHTML.Append("</head>")
            strHTML = strHTML.Append("<body>")
            strHTML = strHTML.Append("<table style='width: 668px'>")
            strHTML = strHTML.Append("<tr>")

            strHTML = strHTML.Append("<td colspan='3'>")
            'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'> Attention:Relationship Managers")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear, " & cboowner.Text & " </u></b> </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = Session("Header")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & Session("Message") & "")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date : " & Date.Now() & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Forwaded By : " & Session("FullNames") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("----------------------------------------End--------------------------------------------------------------------")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("<span style='font-size: 11pt; font-color:RED; font-family: Calibri'><b><i>THIS IS A SYSTEM GENERATED EMAIL.DO NOT REPLY!.</i></b>")
            'Membership Enquiry (membershipenquiry@aar.co.ke)
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("</table>")
            strHTML = strHTML.Append("</body>")
            strHTML = strHTML.Append("</html>")
            Dim mymail As New Emailing
            MailSent = mymail.SendNotification("", LoginSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName, ccemail)
            Session("MailSent") = MailSent
        Catch ex As Exception
            'MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
            MailSent = False
        End Try

        Return MailSent
    End Function
    Protected Sub GD_RISK_ROOT_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_RISK_ROOT.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("Root_ID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""

            DeleteRecord("DELETE FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ROOT_CAUSE] where [Root_ID]= '" & HiddenField1.Value.ToString & "'")

            HiddenField1.Value = ""

            'ResetDisplayed("NewRecord")
            lblroot.Text = "Record Deleted!"
            'CmdSave.Enabled = False

            Load_Root(LBLRISK.Text)

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

        'ShowGridDetails()
    End Sub

    
    Protected Sub RadButton3_Click(sender As Object, e As System.EventArgs) Handles RadButton3.Click
        HiddenField2.Value = 0
        txtroot.Text = ""
        txtcurrcont.Text = ""
        txtmitigation.Text = ""
        dtduedate.DbSelectedDate = Date.Now
        txtowner.Text = ""
    End Sub

    Protected Sub GD_RISK_1_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_RISK_1.DeleteCommand


        Try
            HiddenField1.Value = ""
            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("Risk_Id").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            'Dim File_No As String = ""
            Dim Proposer_Name As String = ""

            UpdateRecord("UPDATE [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER] SET  [Update_Status]=0, Reviewed=0 WHERE [Risk_id]= '" & HiddenField1.Value.ToString & "'")

            HiddenField1.Value = ""



            'CmdSave.Enabled = False

            LoadGrid(FILE_NO.Text)

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
End Class
