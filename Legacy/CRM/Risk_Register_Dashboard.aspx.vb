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
                Str = "select min(Period_From)Period_From,min(Period_To)Period_To from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_PERIOD] where Status='OPEN'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    dtdatefrom.DbSelectedDate = MyDatatable.Rows(0).Item("Period_From").ToString()
                    dtdateto.DbSelectedDate = MyDatatable.Rows(0).Item("Period_To").ToString()
                End If
                Session("Department") = ""
                LOAD_DEPART()
                FILE_NO.Text = Department
            Catch ex As Exception
                lblsubmit.Text = ex.Message
            End Try
        End If
    End Sub

    Protected Sub GD_RISK_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_RISK.PageIndexChanged
        GD_RISK.CurrentPageIndex = e.NewPageIndex
        GD_RISK.DataSource = Session("DEP_01")
        GD_RISK.DataBind()
    End Sub

    Public Sub LOAD_DEPART()
        SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and [Period_To] ='" & CDate(dtdateto.DbSelectedDate).ToString("yyyy-MM-dd") & "' and Reviewed=1 and Sign_off=1"
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

        SqlAction = "select TOP 15 Depart_Code,Department, Risk_Title,Risk_Descr,Root_Cause,Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure] FROM  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER]  where depart_code in (select Depart_Code from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] where sign_off=1 and reviewed=1) and   PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by R_Risk_Rate  desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDOVERAL.DataSource = MyDatable
            GDOVERAL.DataBind()
            'Session("DEP_02") = MyDatable
            MyDatable = Nothing
        Else
            GDOVERAL.DataSource = Nothing
            GDOVERAL.DataBind()
        End If

        SqlAction = "select TOP 10 Department, Risk_Title,Risk_Descr, Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure]   from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE depart_code in (select Depart_Code from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] where sign_off=1 and reviewed=1) and PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  and  action_status='Behind schedule'  order by  R_Risk_Exposure   desc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDOVERDUE.DataSource = MyDatable
            GDOVERDUE.DataBind()
            Session("DEP_02") = MyDatable
            MyDatable = Nothing
        Else
            GDOVERDUE.DataSource = Nothing
            GDOVERDUE.DataBind()
        End If
    End Sub
    Public Sub LoadGrid(ByVal depart As String)
        GD_RISK_SUM1.DataSource = Nothing
        GD_RISK_SUM1.DataBind()
        GD_RISK.DataSource = Nothing
        GD_RISK.DataBind()
        GD_RISK_SUM.DataSource = Nothing
        GD_RISK_SUM.DataBind()
     
       

        SqlAction = "SELECT Risk_Code,[Risk_Id],[Depart_Objective],[Risk_Title],[Risk_Category],[Risk_Impact],[Risk_Likelihood],Perceived_Contr_Eff,Desired_Contr_Effe,R_Risk_Exposure,I_Risk_Exposure,[Due_Date],[Action_Owner],[Action_Status] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' order by Depart_Objective"
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

        SqlAction = "SELECT [IR_Ranking],[Depart_Code],[Period_From],[Period_To],Risk_Code,[Title_Reference],[Impact],[Likelihood],[Inh_Risk_Exposure],[Control_Eff],[R_Risk_Exposure] FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_MASTER_SUMMARY] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by R_Risk_Exposure DESC"
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

        SqlAction = "select TOP 10 Department, Risk_Title,Risk_Descr,Root_Cause,Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure]   from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by  R_Risk_Exposure   DESC"
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

    Protected Sub GDDEPART_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDDEPART.SelectedIndexChanged
        Try

            HiddenField1.Value = (DirectCast(GDDEPART.SelectedItems(0), GridDataItem)).GetDataKeyValue("Id").ToString()
            SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE ID='" & HiddenField1.Value & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("Depart_Code").ToString()
                Session("From") = MyDatable.Rows(0).Item("Period_From").ToString()
                Session("To") = MyDatable.Rows(0).Item("Period_To").ToString()
                LoadGrid(FILE_NO.Text)

            End If


        Catch ex As Exception
            lblsubmit.Text = ex.Message
        End Try


    End Sub


    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    

    Protected Sub RadButton2_Click(sender As Object, e As System.EventArgs) Handles RadButton2.Click
        Try
            GDOVERAL.DataSource = Nothing
            GDOVERAL.DataBind()
            GDDEPART.DataSource = Nothing
            GDDEPART.DataBind()
            GD_RISK_ROOT.DataSource = Nothing
            GD_RISK_ROOT.DataBind()

            SqlAction = "SELECT  [Id],[Period_From],[Period_To],[Depart_Code],[Department],[Owner_Code],[Risk_Owner],[Champion_Name],[Champion_Code],[Status],Due_Date  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_SUMMARY] WHERE PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and [Period_To] ='" & CDate(dtdateto.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND  status<>'OPEN'  and Reviewed=1 and Sign_off=1"
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

            SqlAction = "select TOP 10 Depart_Code,Department, Risk_Title,Risk_Descr,Root_Cause,Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure]   from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER]   WHERE    PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND Action_Status<>'Closed' and Reviewed=1 order by R_Risk_Rate  desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDOVERAL.DataSource = MyDatable
                GDOVERAL.DataBind()
                'Session("DEP_02") = MyDatable
                MyDatable = Nothing
            Else
                GDOVERAL.DataSource = Nothing
                GDOVERAL.DataBind()
            End If

            SqlAction = "select TOP 10 Department, Risk_Title,Risk_Descr, Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure]   from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE depart_code in (select Depart_Code from [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_SUMMARY] where sign_off=1 and reviewed=1) and PERIOD_FROM='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  and  action_status='Behind schedule' and  Reviewed=1  order by  R_Risk_Exposure   desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDOVERDUE.DataSource = MyDatable
                GDOVERDUE.DataBind()
                Session("DEP_02") = MyDatable
                MyDatable = Nothing
            Else
                 GDOVERDUE.DataSource = Nothing
                GDOVERDUE.DataBind()
            End If
        Catch ex As Exception
            lblsubmit.Text = ex.Message
        End Try

    End Sub

    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles RadButton1.Click
        Dim Str As String = "" : Dim Mytable As DataTable = Nothing
        Dim Reportname As String = ""
        Try

   
        Session("EXCEL") = "TO EXCEL"

        If cborpt.SelectedValue = "RR" Then
                SqlAction = "SELECT   [Risk_Id],[Risk_Code],Department,[Period_From],[Period_To],[Depart_Objective], [Risk_Title],[Risk_Descr],[Risk_Category], [Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] where Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM ='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'"
                Reportname = "Register As At-& " & CDate(dtdateto.SelectedDate).ToString("yyyy-MM-dd") & ""

        ElseIf cborpt.SelectedValue = "RS" Then
                SqlAction = "SELECT TOP (10) S.IR_Ranking, S.Depart_Code, S.Title_Reference, S.Inh_Risk_Exposure,S.Control_Eff, S.R_Risk_Exposure, R.Department FROM   [AAR_RISK_DB].dbo.TBL_MIS_RISK_MASTER_SUMMARY S INNER JOIN [AAR_RISK_DB].dbo.TBL_MIS_RISK_DEPART R ON S.Depart_Code = R.Depart_Code WHERE  S.Depart_Code='" & FILE_NO.Text & "' and S.PERIOD_FROM='" & CDate(Session("From")).ToString("yyyy-MM-dd") & "'  order by S.IR_Ranking ASC"
                Reportname = "Summary As At-& " & CDate(dtdateto.SelectedDate).ToString("yyyy-MM-dd") & ""

            ElseIf cborpt.SelectedValue = "T10" Then

                SqlAction = " select TOP 15 Department, Risk_Title,Risk_Descr,Root_Cause,Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure]   from  [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] WHERE  Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM='" & CDate(Session("From")).ToString("yyyy-MM-dd") & "'  order by  R_Risk_Rate   desc"
                Reportname = "Top 10 As At-& " & CDate(dtdateto.SelectedDate).ToString("yyyy-MM-dd") & ""
            ElseIf cborpt.SelectedValue = "OD" Then
                SqlAction = "SELECT   [Risk_Id],[Risk_Code],Department,[Period_From],[Period_To],[Depart_Objective], [Risk_Title],[Risk_Descr],[Risk_Category], [Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] where  PERIOD_FROM ='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND Action_Status='Behind schedule'"
                Reportname = "Overdue As At-& " & CDate(dtdateto.SelectedDate).ToString("yyyy-MM-dd") & ""
            ElseIf cborpt.SelectedValue = "O10" Then
                Session("EXCEL") = Nothing

                SqlAction = "select TOP 15 Risk_Title,Risk_Descr,Root_Cause,Risk_Conseq,[I_Risk_Rate] [Inh_Risk_Exposure],Perceived_Contr_Eff [Control_Eff],R_Risk_Rate [R_Risk_Exposure] ,[Root_Cause],[Current_Contr],[Mitigations],[Due_Date],[Action_Status]  FROM [AAR_RISK_DB].[dbo].[VW_MIS_RISK_MASTER_DET] where  PERIOD_FROM ='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "'  order by  R_Risk_Rate   desc"
                Reportname = "Top_10_Risks"
                'SELECT [Department],[Period_From],[Period_To],[Depart_Objective],[Risk_Title],[Risk_Descr],[Risk_Category],[Risk_Conseq],[Risk_Impact],[Risk_Likelihood],[I_Risk_Exposure],[Perceived_Contr_Eff],[Desired_Contr_Effe],[R_Risk_Exposure],[Due_Date],[Action_Owner],[Action_Status],[Updated_by],[Update_date]  FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER]
            ElseIf cborpt.SelectedValue = "CR" Then
                SqlAction = "SELECT   [Risk_Id],[Risk_Code],Department,[Period_From],[Period_To],[Depart_Objective], [Risk_Title],[Risk_Descr],[Risk_Category], [Root_Cause],[Risk_Conseq],[Risk_Impact],[I_Rate],[Risk_Likelihood],[L_Rate],[I_Risk_Exposure],[I_Risk_Rate],[Current_Contr],[Perceived_Contr_Eff],[Perceived_Rate],[Desired_Contr_Effe],[R_Risk_Rate],[R_Risk_Exposure],[Is_Active],[Mitigations],[Due_Date],[Action_Owner],[Action_Status],[Updated_by] FROM [AAR_RISK_DB].[dbo].[VW_MIS_CRM_RISK_MASTER] where Depart_Code='" & FILE_NO.Text & "' and PERIOD_FROM >='" & CDate(dtdatefrom.DbSelectedDate).ToString("yyyy-MM-dd") & "' and and PERIOD_TO <='" & CDate(dtdateto.DbSelectedDate).ToString("yyyy-MM-dd") & "' AND Action_status='Closed'"
                Reportname = "Closed As At-& " & CDate(dtdateto.SelectedDate).ToString("yyyy-MM-dd") & ""


            End If
            Mytable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            Session("Mytable") = (Mytable)
            Session("Reportname") = Reportname
            ResponseHelper.Redirect("Reports.aspx", "_blank", "")
            Mytable = Nothing
            System.Threading.Thread.Sleep(5000)
        Catch ex As Exception
            lblsubmit.Text = ex.Message
        End Try
    End Sub
    Protected Sub GD_RISK_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_RISK.SelectedIndexChanged
        Try
            Dim Risk_Id As String
            GD_RISK_ROOT.DataSource = Nothing
            GD_RISK_ROOT.DataBind()
           
            Risk_Id = (DirectCast(GD_RISK.SelectedItems(0), GridDataItem)).GetDataKeyValue("Risk_Code").ToString()
            SqlAction = "SELECT Root_id, [Risk_Code],[Root_Cause],[Current_Contr] ,[Mitigations],[Due_Date],Action_Owner,Action_Status  FROM [AAR_RISK_DB].[dbo].[TBL_MIS_RISK_ROOT_CAUSE] WHERE  Risk_Code ='" & Risk_Id & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GD_RISK_ROOT.DataSource = MyDatable
                    GD_RISK_ROOT.DataBind()
                    MyDatable = Nothing
                Else
                    GD_RISK_ROOT.DataSource = Nothing
                    GD_RISK_ROOT.DataBind()
                End If
               
                'Notes
 


        Catch ex As Exception

        End Try
    End Sub
    Protected Sub GDOVERAL_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDOVERAL.ItemDataBound
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
    Protected Sub GD_RISK_SUM1_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GD_RISK_SUM1.ItemDataBound
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

    Protected Sub GDDEPART_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDDEPART.NeedDataSource

    End Sub
End Class
