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
    Dim AB As Integer
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing


                'loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT Product,Syst, [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK)  AND Is_Active=1"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDTracking.DataSource = MyDatable
            GDTracking.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing
        Else
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
        End If
    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    Protected Sub GDNOTES_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDNOTES.PageIndexChanged
        GDNOTES.CurrentPageIndex = e.NewPageIndex
        GDNOTES.DataSource = Session("DAD_NOTES")
        GDNOTES.DataBind()
    End Sub
    

    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
       
        GD_PROPOSER.DataSource = Nothing
        GD_PROPOSER.DataBind()
        GD_Shwaari_Pay.DataSource = Nothing
        GD_Shwaari_Pay.DataBind()
        GD_PROTECT.DataSource = Nothing
        GD_PROTECT.DataBind()
        Try
           


            'Notes
            SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WITH (NOLOCK) WHERE  File_No ='" & STR & "'  AND ACTIVE=1 ORDER BY Note_id DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
                Session("DAD_NOTES") = MyDatable
                MyDatable = Nothing
            Else
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
            End If
            'SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Pay_Ref_No='" & Trim(txtrefno.Text) & "'  AND Is_Active=1"
            'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            'If MyDatable.Rows.Count > 0 Then
            '    GD_Pay.DataSource = MyDatable
            '    GD_Pay.DataBind()
            '    'txtpaid.Text = Convert.ToInt32(MyDatable.Compute("sum(Paid_Amt)", String.Empty))
            '    MyDatable = Nothing
            'Else
            '    GD_Pay.DataSource = Nothing
            '    GD_Pay.DataBind()
            'End If

            GD_PROPOSER.DataSource = Nothing
            GD_PROPOSER.DataBind()
            SqlAction = "SELECT [shwaari_code],[cover_type],[family_size],[plan_name],[plan_limit],[age_band],[premium_amount],[levy_vat],[levy_ext],[stamp_duty], [total_amount], [agent],[proposer_firstname]+' '+[proposer_lastname] proposer, [proposer_dob], [application_date]   FROM [AAR_Protect].[dbo].[SHWAARI_POLICY] WITH (NOLOCK) WHERE shwaari_code='" & Trim(FILE_NO.Text) & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PROPOSER.DataSource = MyDatable
                GD_PROPOSER.DataBind()

                MyDatable = Nothing
            Else
                GD_PROPOSER.DataSource = Nothing
                GD_PROPOSER.DataBind()
            End If

            SqlAction = "SELECT [shwaari_code],[relation],[firstname],[lastname],[phone],[email],[id_number],[dob],[gender],[date_added]  FROM [AAR_Protect].[dbo].[SHWAARI_MEMBERS] WITH (NOLOCK) WHERE shwaari_code='" & Trim(FILE_NO.Text) & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PROTECT.DataSource = MyDatable
                GD_PROTECT.DataBind()

                MyDatable = Nothing
            Else
                GD_PROTECT.DataSource = Nothing
                GD_PROTECT.DataBind()
            End If
            SqlAction = "SELECT [shwaari_code],[payment_code],[amount],[payer_name],[payment_method],[payment_date]  FROM [AAR_Protect].[dbo].[SHWAARI_PAYMENT] WITH (NOLOCK) WHERE shwaari_code='" & Trim(FILE_NO.Text) & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Shwaari_Pay.DataSource = MyDatable
                GD_Shwaari_Pay.DataBind()

                MyDatable = Nothing
            Else
                GD_Shwaari_Pay.DataSource = Nothing
                GD_Shwaari_Pay.DataBind()
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub



    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            HiddenField1.Value = 1

            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT Pay_Ref_No,[File_No],entered_By,Allocated_to,eOx_Invoice_No   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                'txtrefno.Text = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                'txtreceiptamt.Text = MyDatable.Rows(0).Item("Paid_Amt").ToString()
                loadGrid(FILE_NO.Text)

            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
          If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT Syst,Product, [File_No], [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Is_Active=1 ORDER BY Receive_dt DESC"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT Syst,Product, [File_No], [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Business  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Is_Active=1 ORDER BY Receive_dt DESC"
            End If


            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDTracking.DataSource = MyDatable
                GDTracking.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDTracking.DataSource = Nothing
                GDTracking.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub


    Protected Sub GDTracking_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDTracking.NeedDataSource

    End Sub
End Class
