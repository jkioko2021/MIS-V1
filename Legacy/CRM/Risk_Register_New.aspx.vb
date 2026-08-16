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
                Str = "select MIN(Period_From)Period_From,MIN(Period_To)Period_To from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_PERIOD] where Status='OPEN'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    dtfrom.DbSelectedDate = MyDatatable.Rows(0).Item("Period_From").ToString
                    dtto.DbSelectedDate = MyDatatable.Rows(0).Item("Period_To").ToString
                End If

                Str = "SELECT emp_code FROM employees  where username='" & Session("username") & "'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    emp_code = MyDatatable.Rows(0).Item("emp_code").ToString
                    'emp_code = "0622"
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

           


                LOAD_DEPART(Department)
                FILE_NO.Text = Department

                cboobjective.Enabled = False
                txttitle.Enabled = False
                cbocategory.Enabled = False
                txtdescr.Enabled = False

                txtconseq.Enabled = False
             
                LBLRISK.Enabled = False
                btnsave.Enabled = False
                btnedit.Enabled = True
                btnnew.Enabled = True
            Catch ex As Exception
                lblsave.Text = ex.Message
            End Try
        End If
    End Sub
    Protected Sub btnsave2_Click(sender As Object, e As System.EventArgs) Handles btnnew.Click
        HiddenField1.Value = 0

        cboobjective.Enabled = True
        txttitle.Enabled = True
        cbocategory.Enabled = True
        txtdescr.Enabled = True

        txtconseq.Enabled = True
       
        chkactive.Enabled = True
        LBLRISK.Enabled = True
        btnsave.Enabled = True
        btnedit.Enabled = True
        btnnew.Enabled = True



        cboobjective.SelectedValue = ""
        txttitle.Text = ""
        cbocategory.SelectedValue = ""
        txtdescr.Text = ""

        txtconseq.Text = ""
    
        'cboinhe.SelectedValue = ""
     

        LBLRISK.Text = ""
    End Sub
    Protected Sub GD_RISK_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_RISK.PageIndexChanged
        GD_RISK.CurrentPageIndex = e.NewPageIndex
        GD_RISK.DataSource = Session("DEP_01")
        GD_RISK.DataBind()
    End Sub

    Public Sub LOAD_DEPART(ByVal depart As String)
        'SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE Status='OPEN' and [Submitted]=0"
        SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE Depart_Code='" & Department & "'"
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
   
        SqlAction = "SELECT [Risk_Id],[Depart_Objective],[Risk_Title],[Risk_Category],[Risk_Impact],[Risk_Likelihood],[Due_Date],[Action_Owner],[Action_Status],PERIOD_FROM,PERIOD_TO FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  and Is_active=1 order by Depart_Objective"
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



    End Sub

    Protected Sub GDDEPART_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDDEPART.SelectedIndexChanged
        Try
            Session("File") = Nothing
            HiddenField1.Value = (DirectCast(GDDEPART.SelectedItems(0), GridDataItem)).GetDataKeyValue("Id").ToString()
            SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE ID='" & HiddenField1.Value & "' AND STATUS='OPEN'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("Depart_Code").ToString()
                Session("File") = MyDatable.Rows(0).Item("Depart_Code").ToString()
                dtfrom.DbSelectedDate = MyDatable.Rows(0).Item("Period_From").ToString()
                dtto.DbSelectedDate = MyDatable.Rows(0).Item("Period_To").ToString()
                cboowner.SelectedValue = MyDatable.Rows(0).Item("Risk_Owner").ToString()
                chkactive.Checked = True

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
                MyDBAction.update_register(FILE_NO.Text, LBLRISK.Text, CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd"), cboobjective.SelectedValue, txttitle.Text, txtdescr.Text, cbocategory.SelectedValue, "", txtconseq.Text, "", 0, "", 0, "", 0, "", "", 0, "", 0, "", active, "", "", "", "", Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), 0)
            End If


            MyDBAction.Compute_Risk_Values(FILE_NO.Text, LBLRISK.Text, CDate(dtfrom.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtto.DbSelectedDate).ToString("yyyy-MM-dd"))
            lblsave.Text = "Updated Successful!"
            LoadGrid(FILE_NO.Text)


            cboobjective.SelectedValue = ""
            txttitle.Text = ""
            cbocategory.SelectedValue = ""
            txtdescr.Text = ""

            txtconseq.Text = ""
       
            'cboResidual.SelectedValue = ""

            'dtduedate.DbSelectedDate = MyDatable.Rows(0).Item("Due_Date").ToString()

           

            LBLRISK.Text = ""
            btnsave.Enabled = False
        Catch ex As Exception
            lblsave.Text = ex.Message
        End Try
    End Sub

    Protected Sub GD_RISK_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_RISK.SelectedIndexChanged
        Try
            Dim Risk_Id As Integer
            HiddenField1.Value = 1
      
         
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
                chkactive.Checked = MyDatable.Rows(0).Item("Is_active").ToString()
                LBLRISK.Text = MyDatable.Rows(0).Item("Risk_Code").ToString()



                cboobjective.Enabled = False
                txttitle.Enabled = False
                cbocategory.Enabled = False
                txtdescr.Enabled = False

                txtconseq.Enabled = False
              
                'cboResidual.Enabled = False
             

                LBLRISK.Enabled = False
                btnsave.Enabled = False
                btnedit.Enabled = True
                btnnew.Enabled = True
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

        txtconseq.Enabled = True
     
        'cboResidual.Enabled = True
       
        chkactive.Enabled = True
        LBLRISK.Enabled = True
        btnsave.Enabled = True
        btnedit.Enabled = True
        btnnew.Enabled = True
    End Sub

    Protected Sub GD_RISK_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GD_RISK.NeedDataSource

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    

    

    

End Class
