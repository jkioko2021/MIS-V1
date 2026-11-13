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
            dteff.DbSelectedDate = Date.Now
            LOADGRID()
            Try

            Catch ex As Exception

            End Try
        End If
    End Sub

    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Try
            If cbosearch.SelectedValue = "N" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_NAME LIKE '%" & Trim(txtsearch.Text.ToUpper) & "%'"
            ElseIf cbosearch.SelectedValue = "A" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE, [AGENT_TYPE],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE  AGENT_CODE = '" & Trim(txtsearch.Text.ToUpper) & "'"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE PAYROL_NO = '" & txtsearch.Text.ToUpper & "'"
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
            Dim FILE_NO As String
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            lblfile.Text = (DirectCast(GDSEARCH_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("Ref_No").ToString()

            SqlAction = "SELECT  REF_NO,AGENT_NAME,HIER_NAME,AGENT_TYPE,UNIT_CODE,REGION_CODE,SALES_TAX,COMMISSION_RATE,EMAIL,MOBILE_NO,PIN_NO,SEC_MOBILE_NO,EARN_COMMISSION,H_TAX,NSM_CODE,PAY_MODE,ACTIVE,Receive_Date,NID_NO FROM[DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE REF_NO='" & lblfile.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then

                SqlAction = "SELECT [Note_id],[Ref_No],[Notes],[Note_From],[Note_Date]   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_AGENTS_NOTES] WHERE  Ref_No ='" & lblfile.Text & "'  ORDER BY Note_id DESC"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GDNOTES.DataSource = MyDatable
                    GDNOTES.DataBind()
                    MyDatable = Nothing
                Else
                    GDNOTES.DataSource = Nothing
                    GDNOTES.DataBind()
                End If

            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If



        Catch ex As Exception

        End Try
    End Sub

    Public Sub LOADGRID()
        SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE Agent_status IN ('SUSPENDED','TERMINATED')"
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
    End Sub

    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnsubmit.Click
        Try
            If lblfile.Text = "" Then
                lblupload.Text = "Select File Number"
                Exit Sub
            End If
            If cboact.SelectedValue = "" Then
                lblupload.Text = "Select Action"
                Exit Sub
            End If

            MyDBAction.Agent_Deactivate(lblfile.Text, cboact.SelectedValue, Session("username"), cboreasons.SelectedValue)

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES_AGENT_NOTES(lblfile.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

            SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO ='" & lblfile.Text & "'"
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

End Class
