Imports System.Data
Imports DocManage.DataManagement

Imports System.Data.SqlClient

Imports Telerik.Web.UI
Imports DocManage
Imports System.IO

Imports System.Data.OleDb
Imports System.Web.Configuration
Imports Mymail

'Imports Microsoft.Office.Interop
'Imports System.Windows.Forms

Imports Microsoft.VisualBasic
Imports System
'Imports Microsoft.Office.Interop.Excel
Imports CrystalDecisions.CrystalReports.Engine
Imports CrystalDecisions.Shared

Imports Microsoft.Office.Interop
Imports System.Windows.Forms

'Imports System.Web.UI.WebControls


Partial Class Default2
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim SqlAction As String = ""
    Dim Str As String = ""
    'Dim APP As New Excel.Application
    'Dim worksheet As Excel.Worksheet
    'Dim workbook As Excel.Workbook


    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        GDSEARCH_2.DataSource = Nothing
        GDSEARCH_2.DataBind()
        GDSEARCH_1.DataSource = MyDatable
        GDSEARCH_1.DataBind()
        Try
            SqlAction = "SELECT ID, Proposer_Display_Name,Prem_Receipt_no,Prem_Receipt_Date,Rec_Amount,User_display_name,Agents_Updated,Processed  FROM COMMISSION.[dbo].[TBL_MIS_SALES_COMMISSIONS] where Prem_Receipt_no LIKE '%" & Trim(txtsearch.Text) & "%'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                'Session("Application") = MyDatable
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()

            Else
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()
            End If
            SqlAction = "SELECT ID, Proposer_Name,Prem_Receipt_no,Prem_Receipt_Date,Receipt_Amount,User_display_name,COMMISSION  FROM COMMISSION.[dbo].[TBL_COMMISSION_CALC] where Prem_Receipt_no = '" & Trim(txtsearch.Text) & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                'Session("Application") = MyDatable
                GDSEARCH_2.DataSource = MyDatable
                GDSEARCH_2.DataBind()

            Else
                GDSEARCH_2.DataSource = Nothing
                GDSEARCH_2.DataBind()
            End If
        Catch ex As Exception

        End Try
    End Sub

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        Try
            If Not IsPostBack Then
                Str = ""
                'SELECT USER_CODE,USER_DISPLAY_NAME FROM dbo.tbl_rpt_Intermediaries_Report_Listing
                Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS  WHERE  ACTIVE=1 ORDER BY AGENT_NAME" '"
                MyDatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbostatus

                    .Items.Clear()

                    .DataSource = MyDatable
                    .DataTextField = MyDatable.Columns("AGENT_NAME").ToString
                    .DataValueField = MyDatable.Columns("USER_ID").ToString
                    .DataBind()

                End With
                loadGrid_N()
            End If

        Catch ex As Exception

        End Try
    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT ID, Proposer_Display_Name,Prem_Receipt_no,Prem_Receipt_Date,Rec_Amount,User_display_name,Agents_Updated  FROM COMMISSION.[dbo].[TBL_MIS_SALES_COMMISSIONS] where id = '" & lbLID.Text & "'"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            'Session("Application") = MyDatable
            GDSEARCH_1.DataSource = MyDatable
            GDSEARCH_1.DataBind()

        Else
            GDSEARCH_1.DataSource = Nothing
            GDSEARCH_1.DataBind()
        End If

        SqlAction = "SELECT ID, Proposer_Name,Prem_Receipt_no,Prem_Receipt_Date,Receipt_Amount,User_display_name,COMMISSION  FROM COMMISSION.[dbo].[TBL_COMMISSION_CALC] where Prem_Receipt_no = '" & Trim(lblRec.Text) & "'"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            'Session("Application") = MyDatable
            GDSEARCH_2.DataSource = MyDatable
            GDSEARCH_2.DataBind()

        Else
            GDSEARCH_2.DataSource = Nothing
            GDSEARCH_2.DataBind()
        End If

    End Sub
    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click
        Try
            If txtcomm.Text = "" Then
                lblupload.Text = "You Must capture Notes"
                Exit Sub
            End If
            If cbostatus.SelectedValue = "" Then
                lblupload.Text = "You Must Select Agent"
                Exit Sub
            End If


            Str = "SELECT DISTINCT [PREM_RECEIPT_NO] FROM COMMISSION.[dbo].[TBL_COMMISSION_CALC]  WHERE   [PREM_RECEIPT_NO]='" & lblRec.Text & "'" '"
            MyDatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblupload.Text = "Receipt Commission Already Processed!"
            Else

                UpdateRecord("UPDATE [COMMISSION].[dbo].[TBL_MIS_SALES_COMMISSIONS] SET  AGENT_ID='" & cbostatus.SelectedValue & "', READY_TO_PROCESS=1,processed=0,Comments=''  where ID='" & lbLID.Text & "'")
            MyDBAction.MIS_SALES_COMM_RUN(Session("username"))
            If txtcomm.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(lblRec.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd hh:mm:ss tt"), txtcomm.Text)
            End If
            lblupload.Text = "Agent update Successfull!"


                loadGrid_N()
                txtcomm.Text = ""
                lblRec.Text = ""
                lbLID.Text = ""
            End If


        Catch ex As Exception

        End Try
    End Sub
   
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

    End Sub
    Protected Sub GDSEARCH_1_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDSEARCH_1.SelectedIndexChanged
        Try
            lbLID.Text = (DirectCast(GDSEARCH_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("ID").ToString()
            SqlAction = "SELECT  Prem_Receipt_no,AGENT_ID  FROM COMMISSION.[dbo].[TBL_MIS_SALES_COMMISSIONS] where ID='" & lbLID.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblRec.Text = MyDatable.Rows(0).Item("PREM_RECEIPT_NO").ToString()
                cbostatus.SelectedValue = MyDatable.Rows(0).Item("AGENT_ID").ToString()
                'cbostatus.SelectedValue = MyDatable.Rows(0).Item("on_hold").ToString()
            End If


        Catch ex As Exception

        End Try
    End Sub
End Class
