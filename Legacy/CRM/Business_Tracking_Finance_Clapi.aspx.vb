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
    Dim MailSent As Boolean = False
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                HiddenField1.Value = 0
                ltEmbed.Text = ""
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
              
                'Session("username") = "joramt"
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT  T.File_No, T.Proposer_Name, T.To_Cashier_dt, T.Premium, T.File_Status,T.Business_Type, T.Client_Type, T.Allocated_to, T.eOx_Invoice_No,T.Cashier,c.BRANCH_NAME ,t.Entered_By,t.Walk_in_Client,T.Product,T.Syst FROM   dbo.TBL_MIS_CRM_BUSINESS_TRACKING T WITH (NOLOCK) INNER JOIN COMMISSION.dbo.VW_MIS_AGENTS_LISTING C ON T.Agent_Id = C.USER_ID WHERE (T.Forwarded = 1) AND (T.Ready_For_update = 1) AND (T.Allocated = 1) AND (T.Invoiced = 1) AND (T.Receipted = 0) AND (T.Is_Declined = 0) AND (T.Paid = 1)  AND T.Is_Active=1 and  is_clapi=1 AND T.ENTRY_DATE<'2024-01-01'  ORDER BY t.WALK_IN_CLIENT DESC"
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

    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        GD_DOCS.DataSource = Nothing
        GD_DOCS.DataBind()
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        GD_Pay.DataSource = Nothing
        GD_Pay.DataBind()
        GD_PROTECT_PAY.DataSource = Nothing
        GD_PROTECT_PAY.DataBind()
        Try

            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By],Doc_ref FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DOCS.DataSource = MyDatable
                GD_DOCS.DataBind()
                MyDatable = Nothing
            Else
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
            End If

            'Notes
            SqlAction = "SELECT [Note_id],[File_No],[Note_From] ,[Note_date],[Notes]  FROM [CRM].[dbo].[TBL_MIS_CRM_BUS_TRACKING_NOTES] WHERE  File_No ='" & STR & "'  AND ACTIVE=1 ORDER BY Note_id DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
                MyDatable = Nothing
            Else
                GDNOTES.DataSource = MyDatable
                GDNOTES.DataBind()
            End If
            SqlAction = "SELECT [File_No],[Proposer_Name], Premium, Client_Type,Pay_Ref_No,Paid_Amt,File_Status  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Pay_Ref_No='" & Trim(txtrefno.Text) & "'  AND Is_Active=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Pay.DataSource = MyDatable
                GD_Pay.DataBind()
                txtpaid.Text = Convert.ToInt32(MyDatable.Compute("sum(Paid_Amt)", String.Empty))
                MyDatable = Nothing
            Else
                GD_Pay.DataSource = Nothing
                GD_Pay.DataBind()
            End If

            'SqlAction = "SELECT [ID_Number],[Application_ID],[Name],[View_Certificate],[KRA_Pin],[File_Status],[Gender],[Email],[Phone],[Period],[Dob],[Date of Vaccination],[Agent_Name],[Agent_Phone],[Next_of_Kin],[Payment_Unique_ID],[Limit],[Premium_Amount],[Amount_Paid],[Balance],[Amount_To_Pay],[Status],[Application_Date],[Cover_Start_Date],[Cover_ End_Date]  FROM [AAR_Protect].[dbo].[Application_Detail] WITH (NOLOCK) WHERE Payment_Unique_ID='" & Trim(STR) & "'"
            'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            'If MyDatable.Rows.Count > 0 Then
            '    GD_PROTECT.DataSource = MyDatable
            '    GD_PROTECT.DataBind()

            '    MyDatable = Nothing
            'Else
            '    GD_PROTECT.DataSource = Nothing
            '    GD_PROTECT.DataBind()
            'End If

            SqlAction = "SELECT  [MPesa_Code],[Transaction Amount],[Payment Unique ID],[Payee_Details],[Time_Paid]  FROM [AAR_Protect].[dbo].[MPesa_Detail] WITH (NOLOCK) WHERE [Payment Unique ID]='" & Trim(STR) & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_PROTECT_PAY.DataSource = MyDatable
                GD_PROTECT_PAY.DataBind()

                MyDatable = Nothing
            Else
                GD_PROTECT_PAY.DataSource = Nothing
                GD_PROTECT_PAY.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnforward_Click(sender As Object, e As System.EventArgs) Handles btnforward.Click
        Dim a_to As String = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                Exit Sub
            End If

            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If
            If cboAction.SelectedValue = "M" Then

                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Receipted=1,Receipt_no='" & Trim(txtreceipt.Text) & "'  where [File_No]= '" & FILE_NO.Text & "'")
                UpdateRecord("UPDATE [DATA_REPOSITORY_DB_CLAPI].[dbo].[MASTER_MEMBER_LIST_MAPPING] SET eox_receipt_no='" & Trim(txtreceipt.Text) & "'  where [File_No]= '" & FILE_NO.Text & "'")

            ElseIf cboAction.SelectedValue = "RM" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Receipted=0,INVOICED=0  where [File_No]= '" & FILE_NO.Text & "'")
                'UpdateRecord("UPDATE [DATA_REPOSITORY_DB_CLAPI].[dbo].[MASTER_MEMBER_LIST_MAPPING] SET eox_receipt_no='" & Trim(txtreceipt.Text) & "'  where [File_No]= '" & FILE_NO.Text & "'")

            End If


            'End If
            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

         
            'Session("email") = "jmwaniki@aar.co.ke"
            'MailSent = SendLoginDetails(lblenteredby.Text, Session("email"), Session("cc_email"))

            lblerr.Text = "Business updated successfully!"
            loadGrid_N()

            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
            ltEmbed.Text = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub

    Protected Sub DownloadFile(sender As Object, e As EventArgs)
        ltEmbed.Text = ""
        Dim id As Integer = Integer.Parse(TryCast(sender, LinkButton).CommandArgument)
        Dim embed As String = "<object data=""{0}{1}"" type=""application/pdf"" width=""1000px"" height=""600px"">"
        embed += "If you are unable to view file, you can download from <a href = ""{0}{1}&download=1"">here</a>"
        embed += " or download <a target = ""_blank"" href = ""{0}{1}&download=1"">Adobe PDF Reader</a> to view the file."
        embed += "</object>"
        ltEmbed.Text = String.Format(embed, ResolveUrl("~/FileDoc.ashx?Id="), id)
    End Sub


    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            Session("rop_by") = ""
            ltEmbed.Text = ""
            txtproposer.Text = ""
            HiddenField1.Value = 1
            lblenteredby.Text = ""
            lblupdateby.Text = ""
       
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()

            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT Pay_Ref_No,Paid_Amt,[File_No],entered_By,Allocated_to,eOx_Invoice_No,Proposer_Name,ROP_BY,Is_Branch   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "' and Receipted=0"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                'txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                txtproposer.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                'txtrefno.Text = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                txtreceiptamt.Text = MyDatable.Rows(0).Item("Paid_Amt").ToString()
                Session("rop_by") = MyDatable.Rows(0).Item("ROP_By").ToString()
                Session("Is_Branch") = MyDatable.Rows(0).Item("Is_Branch").ToString()
                loadGrid(FILE_NO.Text)
               
              

                'SqlAction = "SELECT [ID_Number],[Application_ID],[Name],[View_Certificate],[KRA_Pin],[File_Status],[Gender],[Email],[Phone],[Period],[Dob],[Date of Vaccination],[Agent_Name],[Agent_Phone],[Next_of_Kin],[Payment_Unique_ID],[Limit],[Premium_Amount],[Amount_Paid],[Balance],[Amount_To_Pay],[Status],[Application_Date],[Cover_Start_Date],[Cover_ End_Date]  FROM [AAR_Protect].[dbo].[Application_Detail] WITH (NOLOCK) WHERE Payment_Unique_ID='" & Trim(FILE_NO.Text) & "'"
                'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                'If MyDatable.Rows.Count > 0 Then
                '    GD_PROTECT.DataSource = MyDatable
                '    GD_PROTECT.DataBind()

                '    MyDatable = Nothing
                'Else
                '    GD_PROTECT.DataSource = Nothing
                '    GD_PROTECT.DataBind()
                'End If


          


                
                End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()

            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Cashier  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & cbo_1.Text & "%' AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=0 AND  Is_Declined=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "I" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Cashier  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE eOx_Invoice_No Like '%" & cbo_1.Text & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=0 AND Is_Declined=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "C" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Cashier  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Cashier Like '%" & cbo_1.SelectedValue & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=0 AND Is_Declined=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "N" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,eOx_Invoice_No,Cashier  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & cbo_1.SelectedValue & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND Allocated=1 AND INVOICED=1 AND [Receipted]=0 AND Is_Declined=0  AND Is_Active=1"

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


    Protected Sub cbosearch_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cbosearch.SelectedIndexChanged
        cbo_1.SelectedValue = ""
        If cbosearch.SelectedValue = "C" Then
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='FINANCE'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbo_1
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        End If
    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    
    
    Protected Sub GDTracking_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTracking.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("WALK_IN_CLIENT")
            If myCell.Text = "Y" Then
                dataItem.BackColor = Drawing.Color.Red
                'myCell.ForeColor = Drawing.Color.White
            End If

            Dim myCell_1 As TableCell = dataItem("Syst")

            If myCell_1.Text = "Clapi" Then
                dataItem.BackColor = Drawing.Color.PaleGreen
                'dataItem.ForeColor = Drawing.Color.Red
            End If
            Dim myCell_2 As TableCell = dataItem("Syst")

            If myCell_2.Text = "Shwaari" Then
                dataItem.BackColor = Drawing.Color.Green
                'dataItem.ForeColor = Drawing.Color.Red
            End If
        End If
    End Sub

End Class
