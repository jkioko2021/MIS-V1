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
            Try

                Dim unit_code As String = ""
                Dim region_code As String = ""
                dtreceive.DbSelectedDate = Date.Now
                dtcontract.DbSelectedDate = Date.Now
           
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                Session("med") = 0
                Session("Allocate") = 0
                Session("INVOICED") = 0
                'ltEmbed.Text = ""
              
                Str = "SELECT  [TITLE_CODE],[NAME]  from [DB_MASTER_AGENTS].[dbo].[TBL_MIS_AGENTS_TYPE]"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbotype
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("NAME").ToString
                    .DataValueField = MyDatatable.Columns("TITLE_CODE").ToString
                    .DataBind()
                End With


                '  SELECT [UNIT_CODE],[UNIT_NAME] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS]
                Str = "SELECT [REGION_CODE],[REGION_NAME] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_REGION] WHERE VALID_TO>=GETDATE()" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboregion
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("REGION_NAME").ToString
                    .DataValueField = MyDatatable.Columns("REGION_CODE").ToString
                    .DataBind()
                End With
                '  
                Str = "SELECT DISTINCT UNIT_CODE,UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] WHERE IS_BDM=1 AND UM_NAME<>''" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbosalesMgr
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("UM_NAME").ToString
                    .DataValueField = MyDatatable.Columns("UNIT_CODE").ToString
                    .DataBind()
                End With
                Me.Str = " SELECT DISTINCT M.GI_UNIT_CODE,GI_UM_NAME +'  ('+ U.GI_UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_GI_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_GI_UNITS] U ON M.GI_UNIT_CODE=U.GI_UNIT_CODE WHERE  GI_UM_NAME<>''"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbosalesGI As RadComboBox = Me.cbosalesGI
                cbosalesGI.Items.Clear()
                cbosalesGI.DataSource = Me.MyDatatable
                cbosalesGI.DataTextField = Me.MyDatatable.Columns("UM_NAME").ToString()
                cbosalesGI.DataValueField = Me.MyDatatable.Columns("GI_UNIT_CODE").ToString()
                cbosalesGI.DataBind()
            Catch ex As Exception

            End Try
        End If

    End Sub
 
    Public Sub LoadGrid(ByVal Ref_no As String)
        Try
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            GD_CONTRACT.DataSource = Nothing
            GD_CONTRACT.DataBind()
            GD_DIRE.DataSource = Nothing
            GD_DIRE.DataBind()
            GD_VIEW.DataSource = Nothing
            GD_VIEW.DataBind()


            SqlAction = "SELECT [ID],[REF_NO],[LICENCE_NO],[VALID_FROM],[VALID_TO],[ENTRY_DATE],Status,CONVERT(DATE,Verified_Date)Verify_Dt  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE REF_NO='" & Trim(Ref_no) & "' AND IS_ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_CONTRACT.DataSource = MyDatable
                GD_CONTRACT.DataBind()
                Session("CONTRACT") = MyDatable
                MyDatable = Nothing
            Else
                GD_CONTRACT.DataSource = Nothing
                GD_CONTRACT.DataBind()
            End If

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
            SqlAction = "SELECT [DOC_ID],[Ref_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_AGENTS_DOCS] WHERE   Ref_No ='" & Ref_no & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DOCS.DataSource = MyDatable
                GD_DOCS.DataBind()
                MyDatable = Nothing
            Else
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
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

            MyDatable = Nothing
            SqlAction = "SELECT [ID],[REF_NO],[NAME],[Entry_Date],[Entry_By] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_NAME_CHANGE] WHERE   Ref_No ='" & Ref_no & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_VIEW.DataSource = MyDatable
                GD_VIEW.DataBind()
                MyDatable = Nothing
            Else
                GD_VIEW.DataSource = Nothing
                GD_VIEW.DataBind()
            End If
        Catch ex As Exception

        End Try
    End Sub
 
     
 
    Protected Sub DownloadFile(sender As Object, e As EventArgs)
        ltEmbed.Text = ""
        Dim id As Integer = Integer.Parse(TryCast(sender, LinkButton).CommandArgument)
        Dim embed As String = "<object data=""{0}{1}"" type=""application/pdf"" width=""1000px"" height=""600px"">"
        embed += "If you are unable to view file, you can download from <a href = ""{0}{1}&download=1"">here</a>"
        embed += " or download <a target = ""_blank"" href = ""{0}{1}&download=1"">Adobe PDF Reader</a> to view the file."
        embed += "</object>"
        ltEmbed.Text = String.Format(embed, ResolveUrl("~/Contract.ashx?Id="), id)
    End Sub


 

    Protected Sub cboregion_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboregion.SelectedIndexChanged
        Try
            cbosalesMgr.Items.Clear()

            Str = "SELECT DISTINCT UNIT_CODE,[UM_NAME] FROM  [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM]  WHERE VALID_TO>=GETDATE() and UNIT_CODE in (SELECT UNIT_CODE FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] WHERE REGION_CODE='" & cboregion.SelectedValue & "') AND UM_NAME<>''" '"
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
            Me.chketims.Checked = False
            Me.lblfile.Text = CType(Me.GDSEARCH_1.SelectedItems(0), GridDataItem).GetDataKeyValue("Ref_No").ToString()
            Me.SqlAction = "SELECT  REF_NO,AGENT_CODE,HRMIS_CODE, AGENT_NAME,HIER_NAME,AGENT_TYPE,UNIT_CODE,REGION_CODE,GI_CODE,SALES_TAX,COMMISSION_RATE,EMAIL,MOBILE_NO,PIN_NO,SEC_MOBILE_NO,EARN_COMMISSION,H_TAX,NSM_CODE,PAY_MODE,ACTIVE,Receive_Date,NID_NO,ETIMS_VERIFIED FROM[DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE REF_NO='" + Me.lblfile.Text + "'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.dtreceive.DbSelectedDate = Me.MyDatable.Rows(0)("Receive_Date").ToString()
                Me.txtname.Text = Me.MyDatable.Rows(0)("AGENT_NAME").ToString()
                Me.cbotype.SelectedValue = Me.MyDatable.Rows(0)("AGENT_TYPE").ToString()
                Me.cbosalesMgr.SelectedValue = Me.MyDatable.Rows(0)("UNIT_CODE").ToString()
                Me.cboregion.SelectedValue = Me.MyDatable.Rows(0)("REGION_CODE").ToString()
                Me.cbosalesGI.SelectedValue = Me.MyDatable.Rows(0)("GI_CODE").ToString()
                Me.txtrate.Text = Me.MyDatable.Rows(0)("COMMISSION_RATE").ToString()
                Me.txtemail.Text = Me.MyDatable.Rows(0)("EMAIL").ToString()
                Me.txtMobile.Text = Me.MyDatable.Rows(0)("MOBILE_NO").ToString()
                Me.txtpin.Text = Me.MyDatable.Rows(0)("PIN_NO").ToString()
                Me.txtMobile2.Text = Me.MyDatable.Rows(0)("SEC_MOBILE_NO").ToString()
                Me.cbofreq.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()
                Me.txtid.Text = Me.MyDatable.Rows(0)("NID_NO").ToString()
                Me.txtagentno.Text = Me.MyDatable.Rows(0)("AGENT_CODE").ToString()
                Me.txtPayroll.Text = Me.MyDatable.Rows(0)("HRMIS_CODE").ToString()
                Dim num As Integer = Me.MyDatable.Rows(0)("ETIMS_VERIFIED").ToString()
                If num = 1 Then
                    Me.chketims.Checked = True
                End If
                Me.MyDatable = Nothing
                Me.LoadGrid(Me.lblfile.Text)
            Else
                Me.GDSEARCH_1.DataSource = Nothing
                Me.GDSEARCH_1.DataBind()
            End If
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
            Me.dtcontract.Enabled = False
            Me.cbosalesGI.Enabled = False
        Catch ex As Exception

        End Try
    End Sub
    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Try
            If cbosearch.SelectedValue = "N" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],RETAIL_RM,CORPORATE_RM,[UM_MANAGER],[REGION_NAME]  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_NAME LIKE '%" & Trim(txtsearch.Text.ToUpper) & "%'"

            ElseIf cbosearch.SelectedValue = "A" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE, [AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],RETAIL_RM,CORPORATE_RM  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE  AGENT_CODE = '" & Trim(txtsearch.Text.ToUpper) & "'"

                'ElseIf cbosearch.SelectedValue = "R" Then
                '    SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO = '" & Trim(txtsearch.Text.ToUpper) & "'"

            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],RETAIL_RM,CORPORATE_RM  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE PAYROL_NO = '" & Trim(txtsearch.Text.ToUpper) & "'"


            End If
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()
                Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO IN (SELECT  [REF_NO]  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_NAME_CHANGE] WHERE  NAME LIKE '%" & Trim(txtsearch.Text.ToUpper) & "%')"
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
            End If
        Catch ex As Exception
            'lblerr.Text = ex.Message
        End Try
    End Sub
End Class
