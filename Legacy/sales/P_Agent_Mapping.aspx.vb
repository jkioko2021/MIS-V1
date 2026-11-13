Imports System.Data
Imports DocManage.DataManagement

Imports System.Data.SqlClient

Imports Telerik.Web.UI
Imports DocManage
Imports System.IO

Imports System.Data.OleDb
Imports System.Web.Configuration
Imports Mymail
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
        If Not IsPostBack Then

            LOADGRID()
            Try

            Catch ex As Exception

            End Try
        End If
    End Sub

   
    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Try
            If cbosearch.SelectedValue = "N" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date,MAP_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_NAME LIKE '%" & Trim(txtsearch.Text.ToUpper) & "%'"
            ElseIf cbosearch.SelectedValue = "A" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE, [AGENT_TYPE],[AGENT_STATUS],Contract_Date,MAP_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE  AGENT_CODE = '" & Trim(txtsearch.Text.ToUpper) & "'"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date,MAP_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE PAYROL_NO = '" & txtsearch.Text.ToUpper & "'"
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


    Protected Sub GDSEARCH_1_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDSEARCH_1.SelectedIndexChanged
        Try

            lblFrom.Text = ""
            Session("FROMID") = ""
            Session("FROMID") = (DirectCast(GDSEARCH_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("USER_ID").ToString()
            SqlAction = "SELECT  REF_NO,AGENT_NAME FROM[DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE USER_ID='" & Session("FROMID") & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblFrom.Text = MyDatable.Rows(0).Item("AGENT_NAME").ToString()
            End If
        Catch ex As Exception
            lblupload.Text = ex.Message
        End Try
    End Sub
    Protected Sub GDSEARCH_2_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDSEARCH_2.SelectedIndexChanged
        Try

            lblTo.Text = ""
            Session("TOID") = ""
            Session("TOID") = (DirectCast(GDSEARCH_2.SelectedItems(0), GridDataItem)).GetDataKeyValue("USER_ID").ToString()
            SqlAction = "SELECT  REF_NO,AGENT_NAME FROM[DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE USER_ID='" & Session("FROMID") & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                lblTo.Text = MyDatable.Rows(0).Item("AGENT_NAME").ToString()
                lblRef.Text = MyDatable.Rows(0).Item("REF_NO").ToString()
            End If
        Catch ex As Exception
            lblupload.Text = ex.Message
        End Try
    End Sub
    Public Sub LOADGRID()
        SqlAction = "SELECT  [REF_NO],[FROM_ID],[FROM_NAME],[TO_ID],[TO_NAME]  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_MAPPING]"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDSEARCH_3.DataSource = MyDatable
            GDSEARCH_3.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GDSEARCH_3.DataSource = Nothing
            GDSEARCH_3.DataBind()
        End If
    End Sub

    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnsubmit.Click
        Try


            MyDBAction.Agent_Mapping(lblRef.Text, Session("FROMID"), Session("TOID"), Session("username"))

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES_AGENT_NOTES(lblRef.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If
            lblupload.Text = "Agent Mapped Successfully"

            Session("FROMID") = ""
            Session("TOID") = ""
            SqlAction = "SELECT  [REF_NO],[FROM_ID],[FROM_NAME],[TO_ID],[TO_NAME]  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_MAPPING] WHERE REF_NO='" & lblRef.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_3.DataSource = MyDatable
                GDSEARCH_3.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_3.DataSource = Nothing
                GDSEARCH_3.DataBind()
            End If

        Catch ex As Exception
            lblupload.Text = ex.Message
        End Try
    End Sub
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)
    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)
    End Sub
    Public Sub LoadGrid(ByVal Ref_no As String)
        Try



        Catch ex As Exception
            'lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub SEARCH0_Click(sender As Object, e As System.EventArgs) Handles SEARCH0.Click
        GDSEARCH_2.DataSource = Nothing
        GDSEARCH_2.DataBind()
        Try
            If cbosearch0.SelectedValue = "N" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date,MAP_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_NAME LIKE '%" & Trim(txtsearch0.Text.ToUpper) & "%'"
            ElseIf cbosearch0.SelectedValue = "A" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE, [AGENT_TYPE],[AGENT_STATUS],Contract_Date,MAP_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE  AGENT_CODE = '" & Trim(txtsearch0.Text.ToUpper) & "'"
            ElseIf cbosearch0.SelectedValue = "P" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date,MAP_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE PAYROL_NO = '" & txtsearch0.Text.ToUpper & "'"
            End If

            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_2.DataSource = MyDatable
                GDSEARCH_2.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_2.DataSource = Nothing
                GDSEARCH_2.DataBind()
            End If
        Catch ex As Exception
            'lblerr.Text = ex.Message
        End Try
    End Sub

End Class
