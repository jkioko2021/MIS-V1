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
    Dim Owner_Code As String = ""
    Dim MyDatatable As DataTable : Dim Str As String
    Dim AB As Integer
    Dim MailSent As Boolean = False
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            Try

                Session("Department") = ""
                Session("Owner_Code") = ""
                dtFrom.DbSelectedDate = Date.Now
                dtTo.DbSelectedDate = Date.Now

                Str = "SELECT emp_code FROM employees  where username='" & Session("username") & "'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    emp_code = MyDatatable.Rows(0).Item("emp_code").ToString
                    'emp_code = "0551"
                    'emp_code = "0519"

                End If

                'select DEPARTMENT from [dbo].[TBL_MIS_RISK_CHAMPS] WHERE EMP_CODE=

                Str = "select Owner_Code,Owner_Name,Department from  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OWNER]  where MIS_CODE='" & emp_code & "'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("Owner_Code") = MyDatatable.Rows(0).Item("Owner_Code").ToString

                Else
                    Str = "select Owner_Code,Owner_Name,Department from  [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OWNER]  where Department IN (select DEPARTMENT from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_CHAMPS] WHERE EMP_CODE='" & emp_code & "')"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("Owner_Code") = MyDatatable.Rows(0).Item("Owner_Code").ToString
                    End If
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

                Str = " select risk  from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_EXPOSURE] where Exposure_type='I'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboinhe
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("risk").ToString
                    .DataValueField = MyDatatable.Columns("risk").ToString
                    .DataBind()
                End With
                Str = " select risk  from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_EXPOSURE] where Exposure_type='R'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboResidual
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("risk").ToString
                    .DataValueField = MyDatatable.Columns("risk").ToString
                    .DataBind()
                End With

                'Str = " select  username from   [dbo].[employees] where activated=1 and deleted=0" ' " '"
                'MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                'With cboActionown
                '    .Items.Clear()
                '    .DataSource = MyDatatable
                '    .DataTextField = MyDatatable.Columns("username").ToString
                '    .DataValueField = MyDatatable.Columns("username").ToString
                '    .DataBind()
                'End With
                Str = "select code,Obj_Name	 from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_OBJE]" '"
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
                'Str = "SELECT  [Status]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ACTION_STATUS] where  Is_Active=1" '"
                'MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                'With cbostatus
                '    .Items.Clear()
                '    .DataSource = MyDatatable
                '    .DataTextField = MyDatatable.Columns("Status").ToString
                '    .DataValueField = MyDatatable.Columns("Status").ToString
                '    .DataBind()
                'End With
                'LOAD_DEPART(Owner_Code)
                FILE_NO.Text = Department


                cboobjective.Enabled = False
                txttitle.Enabled = False
                cbocategory.Enabled = False
                txtdescr.Enabled = False
                'txtroot.Enabled = False
                txtconseq.Enabled = False
                cboimpact.Enabled = False
                cbolikely.Enabled = False
                cboinhe.Enabled = False
                'txtcurrcont.Enabled = False
                cbopercieved.Enabled = False
                cbodesired.Enabled = False
                cboResidual.Enabled = False
                'txtmitigation.Enabled = False
                dtduedate.Enabled = False
                'cboActionown.Enabled = False
                'cbostatus.Enabled = False
                chkactive.Enabled = False
                LBLRISK.Enabled = False
                'btnsave.Enabled = False
                'btnedit.Enabled = True
                'btnnew.Enabled = True
            Catch ex As Exception
                'lblsubmit.Text = ex.Message
            End Try
        End If
    End Sub

    Public Sub LOAD_DEPART(ByVal depart As String)
        SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE    Owner_Code='" & Owner_Code & "'"
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
        SqlAction = "SELECT  TOP 10   [Department], Risk_Title,[Risk_Impact],[Risk_Likelihood],[I_Risk_Exposure],[I_Risk_Rate],[Perceived_Contr_Eff],[R_Risk_Exposure],[R_Risk_Rate] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER]    WHERE    Owner_Code='" & Owner_Code & "' order by [R_Risk_Rate] desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_OVER.DataSource = MyDatable
            GD_RISK_OVER.DataBind()
            Session("GD_RISK_OVER") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK_OVER.DataSource = Nothing
            GD_RISK_OVER.DataBind()
        End If
    End Sub

     
    Public Sub LoadGrid(ByVal depart As String)
        GD_RISK_SUM1.DataSource = Nothing
        GD_RISK_SUM1.DataBind()
        GD_RISK.DataSource = Nothing
        GD_RISK.DataBind()
        GD_RISK_SUM.DataSource = Nothing
        GD_RISK_SUM.DataBind()
     
       

        SqlAction = "SELECT Risk_Code, [Risk_Id],[Depart_Objective],[Risk_Title],[Risk_Category],[Risk_Impact],[Risk_Likelihood],Perceived_Contr_Eff,Desired_Contr_Effe,R_Risk_Exposure,I_Risk_Exposure,[Due_Date],[Action_Owner],[Action_Status] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by Depart_Objective"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK.DataSource = MyDatable
            GD_RISK.DataBind()
            Session("GD_RISK") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK.DataSource = Nothing
            GD_RISK.DataBind()
        End If

        SqlAction = "SELECT [IR_Ranking],[Depart_Code],[Period_From],[Period_To],Risk_Code,[Title_Reference],[Impact],[Likelihood],[Inh_Risk_Exposure],[Control_Eff],[R_Risk_Exposure] FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER_SUMMARY] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(Session("From")).ToString("yyyy-MM-dd") & "'  order by R_Risk_Exposure desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_SUM.DataSource = MyDatable
            GD_RISK_SUM.DataBind()
            Session("GD_RISK_SUM") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK_SUM.DataSource = Nothing
            GD_RISK_SUM.DataBind()
        End If
        SqlAction = "select TOP 10 Risk_Title,Risk_Descr,Root_Cause,Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure]   from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by  R_Risk_Exposure   desc"
        'SqlAction = "SELECT TOP 10 [IR_Ranking],[Depart_Code],[Title_Reference],[Inh_Risk_Exposure],[Control_Eff],[R_Risk_Exposure] FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER_SUMMARY] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(Session("From")).ToString("yyyy-MM-dd") & "'  order by R_Risk_Exposure desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_SUM1.DataSource = MyDatable
            GD_RISK_SUM1.DataBind()
            Session("DEP_02") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK_SUM1.DataSource = Nothing
            GD_RISK_SUM1.DataBind()
        End If



    End Sub
    Protected Sub GD_RISK_SUM_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_RISK_SUM.PageIndexChanged
        GD_RISK_SUM.CurrentPageIndex = e.NewPageIndex
        GD_RISK_SUM.DataSource = Session("GD_RISK_SUM")
        GD_RISK_SUM.DataBind()
    End Sub
    Protected Sub GD_RISK_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_RISK.PageIndexChanged
        GD_RISK.CurrentPageIndex = e.NewPageIndex
        GD_RISK.DataSource = Session("GD_RISK")
        GD_RISK.DataBind()
    End Sub
    Protected Sub GDDEPART_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDDEPART.SelectedIndexChanged
        Try
            Dim Champ As String = ""
            Session("email") = Nothing
            Session("cc_email") = Nothing
            HiddenField1.Value = (DirectCast(GDDEPART.SelectedItems(0), GridDataItem)).GetDataKeyValue("Id").ToString()
            SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE ID='" & HiddenField1.Value & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("Depart_Code").ToString()
                Session("From") = MyDatable.Rows(0).Item("Period_From").ToString()
                Session("To") = MyDatable.Rows(0).Item("Period_To").ToString()
                Champ = MyDatable.Rows(0).Item("Champion_Code").ToString()
                owner.Text = MyDatable.Rows(0).Item("Risk_Owner").ToString()
                champion.Text = MyDatable.Rows(0).Item("Champion_Name").ToString()

                LoadGrid(FILE_NO.Text)
               
            End If


        Catch ex As Exception
            'lblsubmit.Text = ex.Message
        End Try


    End Sub

  





    Protected Sub GD_RISK_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GD_RISK.NeedDataSource

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    
    Protected Sub GD_RISK_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_RISK.SelectedIndexChanged
        Try
            Dim Risk_Code As String
            HiddenField1.Value = 1
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            Risk_Code = (DirectCast(GD_RISK.SelectedItems(0), GridDataItem)).GetDataKeyValue("Risk_code").ToString()
            SqlAction = "SELECT [Risk_Id],[Depart_Code],[Risk_Code],[Period_From],[Period_To],[Depart_Objective],[Risk_Title],[Risk_Descr],[Risk_Category],[Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by],[Update_date],[Submitted],[Reviewed],[Reviewed_by],[Update_Status]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER] WHERE  Risk_Code='" & Risk_Code & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("Depart_Code").ToString()
                cboobjective.SelectedValue = MyDatable.Rows(0).Item("Depart_Objective").ToString()
                txttitle.Text = MyDatable.Rows(0).Item("Risk_Title").ToString()
                cbocategory.SelectedValue = MyDatable.Rows(0).Item("Risk_Category").ToString()
                txtdescr.Text = MyDatable.Rows(0).Item("Risk_Descr").ToString()
                'txtroot.Text = MyDatable.Rows(0).Item("Root_Cause").ToString()
                txtconseq.Text = MyDatable.Rows(0).Item("Risk_Conseq").ToString()
                cboimpact.SelectedValue = MyDatable.Rows(0).Item("Risk_Impact").ToString()
                cbolikely.SelectedValue = MyDatable.Rows(0).Item("Risk_Likelihood").ToString()
                cboinhe.SelectedValue = MyDatable.Rows(0).Item("I_Risk_Exposure").ToString()
                'txtcurrcont.Text = MyDatable.Rows(0).Item("Current_Contr").ToString()
                cbopercieved.SelectedValue = MyDatable.Rows(0).Item("Perceived_Contr_Eff").ToString()
                cbodesired.SelectedValue = MyDatable.Rows(0).Item("Desired_Contr_Effe").ToString()
                cboResidual.SelectedValue = MyDatable.Rows(0).Item("R_Risk_Exposure").ToString()
                'txtmitigation.Text = MyDatable.Rows(0).Item("Mitigations").ToString()
                dtduedate.DbSelectedDate = MyDatable.Rows(0).Item("Due_Date").ToString()
                'cboActionown.SelectedValue = MyDatable.Rows(0).Item("Action_Owner").ToString()
                'cbostatus.SelectedValue = MyDatable.Rows(0).Item("Action_Status").ToString()
                chkactive.Checked = MyDatable.Rows(0).Item("Is_active").ToString()
                LBLRISK.Text = MyDatable.Rows(0).Item("Risk_Code").ToString()

                SqlAction = "SELECT Root_id, [Risk_Code],[Root_Cause],[Current_Contr] ,[Mitigations],[Due_Date],Action_Owner,Action_Status  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ROOT_CAUSE] WHERE  Risk_Code ='" & LBLRISK.Text & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GD_RISK_ROOT.DataSource = MyDatable
                    GD_RISK_ROOT.DataBind()
                    MyDatable = Nothing
                Else
                    GD_RISK_ROOT.DataSource = Nothing
                    GD_RISK_ROOT.DataBind()
                End If
                SqlAction = "SELECT [Note_id],[Risk_Code],[Notes_by] ,[Note_date],[Notes]  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_NOTES] WHERE  Risk_Code ='" & LBLRISK.Text & "' and Period_From='" & CDate(Session("From")).ToString("yyyy-MM-dd") & "' ORDER BY Note_id DESC"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GDNOTES.DataSource = MyDatable
                    GDNOTES.DataBind()
                    MyDatable = Nothing
                Else
                    GDNOTES.DataSource = Nothing
                    GDNOTES.DataBind()
                End If
                'Notes


                cboobjective.Enabled = False
                txttitle.Enabled = False
                cbocategory.Enabled = False
                txtdescr.Enabled = False
                'txtroot.Enabled = False
                txtconseq.Enabled = False
                cboimpact.Enabled = False
                cbolikely.Enabled = False
                cboinhe.Enabled = False
                'txtcurrcont.Enabled = False
                cbopercieved.Enabled = False
                cbodesired.Enabled = False
                cboResidual.Enabled = False
                'txtmitigation.Enabled = False
                dtduedate.Enabled = False
                'cboActionown.Enabled = False
                'cbostatus.Enabled = False
                chkactive.Enabled = False
                LBLRISK.Enabled = False


                'btnnew.Enabled = True
            End If


        Catch ex As Exception

        End Try
    End Sub

    Protected Sub GD_RISK_SUM_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GD_RISK_SUM.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("R_Risk_Exposure")
            If myCell.Text > 32.5 Then
                dataItem.BackColor = Drawing.Color.Red
            ElseIf myCell.Text > 12.5 And myCell.Text <= 32.49 Then
                dataItem.BackColor = Drawing.Color.Orange
            ElseIf myCell.Text > 5.5 And myCell.Text <= 12.49 Then
                dataItem.BackColor = Drawing.Color.LightYellow
            ElseIf myCell.Text > 0 And myCell.Text <= 5.5 Then
                dataItem.BackColor = Drawing.Color.LightGreen
                'ElseIf myCell.Text = "" Then
                '    dataItem.BackColor = Drawing.Color.CadetBlue

            End If

        End If
    End Sub
    Protected Sub GD_RISK_OVER_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GD_RISK_OVER.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("R_Risk_Rate")
            If myCell.Text > 32.5 Then
                dataItem.BackColor = Drawing.Color.Red
            ElseIf myCell.Text > 12.5 And myCell.Text <= 32.49 Then
                dataItem.BackColor = Drawing.Color.Orange
            ElseIf myCell.Text > 5.5 And myCell.Text <= 12.49 Then
                dataItem.BackColor = Drawing.Color.LightYellow
            ElseIf myCell.Text > 0 And myCell.Text <= 5.5 Then
                dataItem.BackColor = Drawing.Color.LightGreen
                'ElseIf myCell.Text = "" Then
                '    dataItem.BackColor = Drawing.Color.CadetBlue

            End If

        End If
    End Sub
    Protected Sub GD_RISK_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GD_RISK.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("Action_Status")
            If myCell.Text = "Behind schedule" Then
                dataItem.BackColor = Drawing.Color.Red
            ElseIf myCell.Text = "Closed" Then
                dataItem.BackColor = Drawing.Color.Green

            End If

        End If
    End Sub
    

    Protected Sub RadButton2_Click(sender As Object, e As System.EventArgs) Handles RadButton2.Click
        SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE Owner_Code='" & Session("Owner_Code") & "' AND Period_From='" & CDate(dtFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'"
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

        SqlAction = "SELECT  TOP 10   [Department], Risk_Title,[Risk_Impact],[Risk_Likelihood],[I_Risk_Exposure],[I_Risk_Rate],[Perceived_Contr_Eff],[R_Risk_Exposure],[R_Risk_Rate] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER]    WHERE  PERIOD_FROM='" & CDate(dtFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by [R_Risk_Rate] desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_RISK_OVER.DataSource = MyDatable
            GD_RISK_OVER.DataBind()
            Session("GD_RISK_OVER") = MyDatable
            MyDatable = Nothing
        Else
            GD_RISK_OVER.DataSource = Nothing
            GD_RISK_OVER.DataBind()
        End If
    End Sub

    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String = ""
        Try


            Session("EXCEL") = "TO EXCEL"

            If cborpt.SelectedValue = "RR" Then
                SqlAction = "SELECT   [Risk_Id],[Risk_Code],Department,[Period_From],[Period_To],[Depart_Objective], [Risk_Title],[Risk_Descr],[Risk_Category], [Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] where Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM >='" & CDate(dtFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and and PERIOD_TO <='" & CDate(dtTo.DbSelectedDate).ToString("yyyy-MM-dd") & "'"
                Reportname = "Register As At-& " & CDate(dtTo.SelectedDate).ToString("yyyy-MM-dd") & ""

            ElseIf cborpt.SelectedValue = "RS" Then
                SqlAction = "SELECT TOP (10) S.IR_Ranking, S.Depart_Code, S.Title_Reference, S.Inh_Risk_Exposure,S.Control_Eff, S.R_Risk_Exposure, R.Department FROM   [AAR_RISK_DB].dbo.TBL_MIS_RISK_MASTER_SUMMARY S INNER JOIN [AAR_RISK_DB].dbo.TBL_MIS_RISK_DEPART R ON S.Depart_Code = R.Depart_Code WHERE  S.Depart_Code='" & FILE_NO.Text & "' and S.PERIOD_FROM='" & CDate(Session("From")).ToString("yyyy-MM-dd") & "'  order by S.IR_Ranking ASC"
                Reportname = "Summary As At-& " & CDate(dtTo.SelectedDate).ToString("yyyy-MM-dd") & ""
                'SELECT [Department],[Period_From],[Period_To],[Depart_Objective],[Risk_Title],[Risk_Descr],[Risk_Category],[Risk_Conseq],[Risk_Impact],[Risk_Likelihood],[I_Risk_Exposure],[Perceived_Contr_Eff],[Desired_Contr_Effe],[R_Risk_Exposure],[Due_Date],[Action_Owner],[Action_Status],[Updated_by],[Update_date]  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER]
            ElseIf cborpt.SelectedValue = "CR" Then
                SqlAction = "SELECT   [Risk_Id],[Risk_Code],Department,[Period_From],[Period_To],[Depart_Objective], [Risk_Title],[Risk_Descr],[Risk_Category], [Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] where Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM >='" & CDate(dtFrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and and PERIOD_TO <='" & CDate(dtTo.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND Action_status='Closed'"
                Reportname = "Closed As At-& " & CDate(dtTo.SelectedDate).ToString("yyyy-MM-dd") & ""


            End If
            Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
        Catch ex As Exception
            '' lblsubmit.Text = ex.Message
        End Try
    End Sub
End Class
