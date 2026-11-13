Imports System.Data
Imports System.Data.OleDb
Imports System.Data.SqlClient
Imports System.IO
Imports System.Web.Configuration
Imports DocManage
Imports DocManage.DataManagement
Imports Mymail
Imports NPOI.SS.Formula.Functions
Imports Telerik.Web.UI
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

        If Not Me.IsPostBack Then
            Try
                Me.Session("CODED") = 0
                Me.dtreceive.DbSelectedDate = DateTime.Now
                Me.dtcontract.DbSelectedDate = DateTime.Now
                Me.dtLicetart.DbSelectedDate = Me.firstDayOfYear(DateAndTime.Year(DateTime.Now))
                Me.dtLiceend.DbSelectedDate = Me.LastDayOfYear(DateAndTime.Year(DateTime.Now))
                Me.Session("empcode") = Nothing
                Me.Session("agentemail") = Nothing
                Me.Session("med") = 0
                Me.Session("Allocate") = 0
                Me.Session("INVOICED") = 0
                Me.lblIM.Text = ""
                Me.HiddenField1.Value = 0
                Me.HiddenField2.Value = 0
                Me.Str = "SELECT  [TITLE_CODE],[NAME]  from [DB_MASTER_AGENTS].[dbo].[TBL_MIS_AGENTS_TYPE]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbotype As RadComboBox = Me.cbotype
                cbotype.Items.Clear()
                cbotype.DataSource = Me.MyDatatable
                cbotype.DataTextField = Me.MyDatatable.Columns("NAME").ToString()
                cbotype.DataValueField = Me.MyDatatable.Columns("TITLE_CODE").ToString()
                cbotype.DataBind()
                Me.chkcon.Checked = True
                Me.chkira.Checked = True
                Me.chkkyc.Checked = True
                Me.chkwaiver.Checked = False

                Me.Str = "SELECT [REGION_CODE],[REGION_NAME] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_REGION] WHERE VALID_TO>=GETDATE()"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboregion As RadComboBox = Me.cboregion
                cboregion.Items.Clear()
                cboregion.DataSource = Me.MyDatatable
                cboregion.DataTextField = Me.MyDatatable.Columns("REGION_NAME").ToString()
                cboregion.DataValueField = Me.MyDatatable.Columns("REGION_CODE").ToString()
                cboregion.DataBind()

                Me.Str = "SELECT DISTINCT M.UNIT_CODE,UM_NAME +'  ('+ U.UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] U ON M.UNIT_CODE=U.UNIT_CODE WHERE IS_BDM=1 AND UM_NAME<>''"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbosalesMgr As RadComboBox = Me.cbosalesMgr
                cbosalesMgr.Items.Clear()
                cbosalesMgr.DataSource = Me.MyDatatable
                cbosalesMgr.DataTextField = Me.MyDatatable.Columns("UM_NAME").ToString()
                cbosalesMgr.DataValueField = Me.MyDatatable.Columns("UNIT_CODE").ToString()
                cbosalesMgr.DataBind()

                Me.Str = " SELECT DISTINCT M.GI_UNIT_CODE,GI_UM_NAME +'  ('+ U.GI_UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_GI_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_GI_UNITS] U ON M.GI_UNIT_CODE=U.GI_UNIT_CODE WHERE  GI_UM_NAME<>''"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cbosalesGI As RadComboBox = Me.cbosalesGI
                cbosalesGI.Items.Clear()
                cbosalesGI.DataSource = Me.MyDatatable
                cbosalesGI.DataTextField = Me.MyDatatable.Columns("UM_NAME").ToString()
                cbosalesGI.DataValueField = Me.MyDatatable.Columns("GI_UNIT_CODE").ToString()
                cbosalesGI.DataBind()
                Me.LoadGrid_All()
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Private Function LastDayOfYear(ByVal d As Integer) As DateTime
        Dim time As New DateTime((d + 1), 1, 1)
        Return time.AddDays(-1)
    End Function
    Private Function firstDayOfYear(ByVal d As Integer) As DateTime
        Dim time As New DateTime(d, 1, 1)
        Return time
    End Function
    Public Sub LoadGrid(ByVal Ref_no As String)
        Try
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
            GD_CONTRACT.DataSource = Nothing
            GD_CONTRACT.DataBind()
            GD_DIRE.DataSource = Nothing
            GD_DIRE.DataBind()

            SqlAction = "SELECT [ID],[REF_NO],[LICENCE_NO],[VALID_FROM],[VALID_TO],[ENTRY_DATE],[USER_ID]  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE REF_NO='" & Ref_no & "'"
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

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Public Sub LoadGrid_All()
        Try
            SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date,AGENT_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE CODED=0 AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()
                Session("DAD_CODE") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub GDSEARCH_1_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDSEARCH_1.PageIndexChanged
        GDSEARCH_1.CurrentPageIndex = e.NewPageIndex
        GDSEARCH_1.DataSource = Session("DAD_CODE")
        GDSEARCH_1.DataBind()
    End Sub
    Protected Sub cmdsave_Click(sender As Object, e As System.EventArgs) Handles cmdsave.Click
        Try
            Dim name_changed As String = ""
            Dim integrated As Integer = 0
            If cbosalesMgr.SelectedValue = "" Then
                lblerr.Text = "Select Sales Manager"
                Exit Sub
            End If
            If cboregion.SelectedValue = "" Then
                lblerr.Text = "Select Region"
                Exit Sub
            End If



            If chketims.Checked = True Then
                integrated = 1
            Else
                integrated = 0
            End If

            If lblfile.Text = "" Then
                Generate_Task()
                MyDBAction.MIS_SALES_INTERMEDIARY(lblfile.Text, txtname.Text, cbotype.SelectedValue, cbosalesMgr.SelectedValue, cboregion.SelectedValue, txtrate.Text, txtemail.Text, txtMobile.Text, txtpin.Text, txtMobile2.Text, cbofreq.SelectedValue, Session("UserName").ToString, CDate(dtreceive.DbSelectedDate).ToString("yyyy-MM-dd"), txtid.Text, CDate(dtcontract.DbSelectedDate).ToString("yyyy-MM-dd"), txtPayroll.Text, txtagentno.Text, name_changed, integrated, Me.cbosalesGI.SelectedValue)

            Else

                'If HiddenField1.Value = 0 Then
                '    Generate_Task()
                '    MyDBAction.MIS_SALES_INTERMEDIARY(lblfile.Text, txtname.Text, cbotype.SelectedValue, cbosalesMgr.SelectedValue, cboregion.SelectedValue, txtrate.Text, txtemail.Text, txtMobile.Text, txtpin.Text, txtMobile2.Text, cbofreq.SelectedValue, Session("UserName").ToString, CDate(dtreceive.DbSelectedDate).ToString("yyyy-MM-dd"), txtid.Text, CDate(dtcontract.DbSelectedDate).ToString("yyyy-MM-dd"), txtPayroll.Text, txtagentno.Text)
                '    If txtcomm.Text <> "" Then
                '        MyDBAction.TRACKING_MESSAGES_AGENT_NOTES(lblfile.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomm.Text)
                '    End If
                'Else
                If lblfile.Text = "" Then
                    lblerr.Text = "Select File Number"
                    Exit Sub
                End If

                MyDBAction.MIS_SALES_INTERMEDIARY(lblfile.Text, txtname.Text, cbotype.SelectedValue, cbosalesMgr.SelectedValue, cboregion.SelectedValue, txtrate.Text, txtemail.Text, txtMobile.Text, txtpin.Text, txtMobile2.Text, cbofreq.SelectedValue, Session("UserName").ToString, CDate(dtreceive.DbSelectedDate).ToString("yyyy-MM-dd"), txtid.Text, CDate(dtcontract.DbSelectedDate).ToString("yyyy-MM-dd"), txtPayroll.Text, txtagentno.Text, name_changed, integrated, Me.cbosalesGI.SelectedValue)
                'End If

            End If
            lblerr.Text = "Saved Successful!"
            SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],AGENT_CODE  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO='" & lblfile.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_1.DataSource = MyDatable
                GDSEARCH_1.DataBind()
                'Session("DAD_T") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If

            txtname.Text = ""
            cbotype.SelectedValue = ""
            cbosalesMgr.SelectedValue = ""
            cboregion.SelectedValue = ""
            txtrate.Text = ""
            txtemail.Text = ""
            txtMobile.Text = ""
            txtpin.Text = ""
            txtMobile2.Text = ""
            cbofreq.SelectedValue = ""
 
            HiddenField1.Value = 0
            txtid.Text = ""
            dtcontract.DbSelectedDate = Date.Now
            txtPayroll.Text = ""
            txtagentno.Text = ""
            dtreceive.DbSelectedDate = Date.Now
            txtcomm.Text = 0.1


        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Public Sub Generate_Task()

        SqlAction = "SELECT ISNULL((MAX(Id)+1),1) NUMBER FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY]"
        MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatatable.Rows.Count > 0 Then
            AB = MyDatatable.Rows(0).Item("NUMBER").ToString()
            Dim numStr4ch As String = Strings.Right("0000" & AB.ToString(), 4)
            lblfile.Text = Left(cbotype.SelectedValue, 2) & "-" & Month(Date.Now()) & "/" & Right(Year(Date.Now()), 2) & "/-" + numStr4ch + ""
        End If
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
    Protected Sub cmdedit_Click(sender As Object, e As System.EventArgs) Handles cmdedit.Click
        HiddenField1.Value = 1

        txtname.Enabled = False
        cbotype.Enabled = True
        cbosalesMgr.Enabled = True
        cboregion.Enabled = True
        txtrate.Enabled = True
        txtemail.Enabled = True
        txtMobile.Enabled = True
        txtpin.Enabled = True
        txtMobile2.Enabled = True
        cbofreq.Enabled = True
        txtagentno.Enabled = True
        txtPayroll.Enabled = True

        cbodoc.Enabled = True
        txtlicence.Enabled = True
        txtcomm.Enabled = True
        dtLiceend.Enabled = True
        dtLicetart.Enabled = True

        txtid.Enabled = True
        txtagentno.Enabled = False
        If Session("CODED") = 0 Then
            btnsubmit.Enabled = True
            chkcompl.Enabled = True
        Else
            btnsubmit.Enabled = False
            chkcompl.Enabled = False
        End If
    End Sub

    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Try
            If cbosearch.SelectedValue = "N" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE,[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_NAME LIKE '%" & (txtsearch.Text.ToUpper) & "%'"

            ElseIf cbosearch.SelectedValue = "A" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE, [AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE  AGENT_CODE = '" & (txtsearch.Text.ToUpper) & "'"

                'ElseIf cbosearch.SelectedValue = "R" Then
                '    SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS], Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO = '" & Trim(txtsearch.Text.ToUpper) & "'"

            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],AGENT_CODE,[AGENT_TYPE],[UNIT_NAME],[UM_MANAGER],[REGION_NAME],[REGION_MANAGER],[AGENT_STATUS], Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE PAYROL_NO = '" & txtsearch.Text.ToUpper & "'"

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

    Protected Sub cboregion_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboregion.SelectedIndexChanged
        Try
            cbosalesMgr.Items.Clear()
            'Str = "SELECT DISTINCT M.UNIT_CODE,UM_NAME +'  ('+ U.UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] U ON M.UNIT_CODE=U.UNIT_CODE WHERE  VALID_TO>=GETDATE() and M.UNIT_CODE in (SELECT UNIT_CODE FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] WHERE REGION_CODE='" & cboregion.SelectedValue & "') AND UM_NAME<>''"

            Str = "SELECT DISTINCT M.UNIT_CODE,UM_NAME +'  ('+ U.UNIT_NAME +')' UM_NAME  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UM] M inner Join [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] U ON M.UNIT_CODE=U.UNIT_CODE WHERE  M.VALID_TO>=GETDATE() and M.UNIT_CODE in (SELECT UNIT_CODE FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_UNITS] WHERE REGION_CODE='" & cboregion.SelectedValue & "') AND UM_NAME<>''" '"
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
            Session("email") = ""
            Session("email_cc") = ""
            Dim FILE_NO As String
            Session("CODED") = 0
            lblsub.Text = ""
            lblfile.Text = (DirectCast(GDSEARCH_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("AGENT_CODE").ToString()
            SqlAction = "SELECT USER_ID,CODED,Licence_No, REF_NO,AGENT_NAME,HIER_NAME,AGENT_TYPE,AGENT_CODE,COMMISSION_RATE, UNIT_CODE,REGION_CODE,SALES_TAX,COMMISSION_RATE,EMAIL,MOBILE_NO,PIN_NO,SEC_MOBILE_NO,EARN_COMMISSION,H_TAX,NSM_CODE,PAY_MODE,ACTIVE,Receive_Date,NID_NO,HRMIS_CODE,Contract_Date,[ETIMS_VERIFIED] FROM[DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE Agent_Code='" & lblfile.Text & "'"
            'SqlAction = "SELECT AGENT_TYPE,SUM(MEDICAL)MEDICAL,SUM([NON-MED])[NON-MED],SUM(NEW)NEW,SUM(RENEWAL)RENEWAL,SUM(TOTAL_PREMIUMS)TOTAL_PREMIUMS FROM [dbo].[VW_SALES_PRODUTION_PER_CHANNEL] WHERE  R_CODE='" & cboregion.SelectedValue & "' AND  YEAR(INVOICE_DATE)='" & cboyear.SelectedValue & "' GROUP BY AGENT_TYPE  ORDER BY SUM(TOTAL_PREMIUMS) DESC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                dtreceive.DbSelectedDate = MyDatable.Rows(0).Item("Receive_Date").ToString()
                txtname.Text = MyDatable.Rows(0).Item("AGENT_NAME").ToString()
                cbotype.SelectedValue = MyDatable.Rows(0).Item("AGENT_TYPE").ToString()
                cbosalesMgr.SelectedValue = MyDatable.Rows(0).Item("UNIT_CODE").ToString()
                cboregion.SelectedValue = MyDatable.Rows(0).Item("REGION_CODE").ToString()
                txtrate.Text = MyDatable.Rows(0).Item("COMMISSION_RATE").ToString()
                txtemail.Text = MyDatable.Rows(0).Item("EMAIL").ToString()
                txtMobile.Text = MyDatable.Rows(0).Item("MOBILE_NO").ToString()
                txtpin.Text = MyDatable.Rows(0).Item("PIN_NO").ToString()
                txtMobile2.Text = MyDatable.Rows(0).Item("SEC_MOBILE_NO").ToString()
                cbofreq.SelectedValue = MyDatable.Rows(0).Item("PAY_MODE").ToString()
                txtid.Text = MyDatable.Rows(0).Item("NID_NO").ToString()
                txtagentno.Text = MyDatable.Rows(0).Item("AGENT_CODE").ToString()
                txtPayroll.Text = MyDatable.Rows(0).Item("HRMIS_CODE").ToString()
                dtcontract.DbSelectedDate = MyDatable.Rows(0).Item("Contract_Date").ToString()
                lblfile.Text = MyDatable.Rows(0).Item("Ref_No").ToString()
                Session("CODED") = MyDatable.Rows(0).Item("CODED").ToString()
                txtlicence.Text = MyDatable.Rows(0).Item("Licence_No").ToString()
                txtlicence.Text = MyDatable.Rows(0).Item("[ETIMS_VERIFIED").ToString()


                'LBL= MyDatable.Rows(0).Item("USER_ID").ToString()
                If Session("CODED") = 0 Then
                    btnsubmit.Enabled = True
                    chkcompl.Enabled = True
                Else
                    btnsubmit.Enabled = False
                    chkcompl.Enabled = False
                End If
                SqlAction = "SELECT AGENT_NAME, AGENT_EMAIL,UM_EMAIL FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE AGENT_CODE='" & (lblfile.Text) & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    Session("email") = MyDatable.Rows(0).Item("AGENT_EMAIL").ToString()
                    Session("email_cc") = MyDatable.Rows(0).Item("UM_EMAIL").ToString()

                End If
                MyDatable = Nothing
                LoadGrid(lblfile.Text)
            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If
            HiddenField1.Value = 1
            txtname.Enabled = False
            cbotype.Enabled = False
            cbosalesMgr.Enabled = False
            cboregion.Enabled = False
            txtrate.Enabled = False
            txtemail.Enabled = False
            txtMobile.Enabled = False
            txtpin.Enabled = False
            txtMobile2.Enabled = False
            cbofreq.Enabled = False
            txtid.Enabled = False
            dtreceive.Enabled = False
            cbodoc.Enabled = False
            txtlicence.Enabled = False
            txtcomm.Enabled = False
            txtlicence.Enabled = False
            dtcontract.Enabled = False
        Catch ex As Exception

        End Try
    End Sub
    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click
        Dim MyDatable As New Data.DataTable
        Dim STS As Integer
        Dim aar As Integer = 0
        Dim PROPOSER_ID As String
        Dim PERIOD As String
        Dim FILENO As String
        Dim filePath As String = FL1.PostedFile.FileName
        Dim filename As String = Path.GetFileName(filePath)
        Dim ext As String = Path.GetExtension(filename)
        Dim contenttype As String = String.Empty
        Dim fs As Stream = FL1.PostedFile.InputStream
        Dim br As New BinaryReader(fs)
        Dim bytes As Byte() = br.ReadBytes(DirectCast(fs.Length, Long))
        Dim KYC As String = ""
        Dim Contract_Signed As String = ""
        Dim Compliance As Integer = 0

        Dim app As Integer = 0
        ltEmbed.Text = ""
        Try
            If lblfile.Text = "" Then
                lblupload.Text = "You must Select The file!"
                Exit Sub
            End If

            Select Case ext
                Case ".doc"
                    contenttype = "application/vnd.ms-word"
                    Exit Select
                Case ".docx"
                    contenttype = "application/vnd.ms-word"
                    Exit Select
                Case ".xls"
                    contenttype = "application/vnd.ms-excel"
                    Exit Select
                Case ".xlsx"
                    contenttype = "application/vnd.ms-excel"
                    Exit Select
                Case ".jpg"
                    contenttype = "image/jpg"
                    Exit Select
                Case ".png"
                    contenttype = "image/png"
                    Exit Select
                Case ".gif"
                    contenttype = "image/gif"
                    Exit Select
                Case ".jpeg"
                    contenttype = "image/jpeg"
                    Exit Select
                Case ".pdf"
                    contenttype = "application/pdf"
                    Exit Select
                Case ".rar"
                    contenttype = "application/zip"
                    Exit Select
                Case ".zip"
                    contenttype = "application/zip"
                    Exit Select
            End Select
            If chkkyc.Checked = True Then
                KYC = "Yes"
            Else
                KYC = "No"

            End If
            If chkwaiver.Checked = True Then
                If chkcon.Checked = False And chkira.Checked = False Then
                    Compliance = 1 'Contract=No,IRA=No                  

                ElseIf chkcon.Checked = False And chkira.Checked = True Then
                    Compliance = 2 'Contract=No,IRA=Yes                  

                ElseIf chkcon.Checked = True And chkira.Checked = False Then
                    Compliance = 3 'Contract=Yes,IRA=No

                ElseIf chkcon.Checked = True And chkira.Checked = True And chkkyc.Checked = False Then
                    Compliance = 4 'Contract=Yes,IRA=Yes

                End If
                If Compliance = 1 Then
                    MyDBAction.UPLOAD_File_ADD_LICENCE(lblfile.Text, txtlicence.Text, CDate(dtLicetart.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtLiceend.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), 1, Compliance, KYC)

                Else
                    MyDBAction.UPLOAD_File_DOC_CONTRACT(bytes, filename, contenttype, lblfile.Text, (cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, (txtlicence.Text.ToUpper))
                    MyDBAction.UPLOAD_File_ADD_LICENCE(lblfile.Text, txtlicence.Text, CDate(dtLicetart.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtLiceend.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), 1, Compliance, KYC)
                End If
            Else
                If chkcon.Checked = False Or chkira.Checked = False Or chkkyc.Checked = False Then
                    lblupload.Text = "You Must Authorize waiver!"
                    Exit Sub
                Else
                    Compliance = 0
                    If FL1.PostedFile.FileName = "" Then
                        lblupload.Text = "You must upload a reference pdf file!"
                        Exit Sub
                    End If
                    If cbodoc.Text = "" Then
                        lblupload.Text = "You must Select Document title!"
                        Exit Sub
                    End If

                    If contenttype <> String.Empty Then
                        Dim fileLocation As String = ""
                        Dim st = 0 'Contract=YES,IRA=YES,KYC=YES
                        MyDBAction.UPLOAD_File_DOC_CONTRACT(bytes, filename, contenttype, lblfile.Text, (cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, txtlicence.Text)
                        'Response.Redirect(Request.Url.AbsoluteUri)
                        MyDBAction.UPLOAD_File_ADD_LICENCE(lblfile.Text, txtlicence.Text, CDate(dtLicetart.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtLiceend.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), 1, Compliance, KYC)
                        lblupload.ForeColor = System.Drawing.Color.Green

                    Else
                        lblupload.Text = "File format not recognised." _
                    & " Upload Image/Word/PDF/Excel formats"
                    End If

                End If
                MailSent = SendLoginDetails(Session("to"), Session("email"), Session("email_cc"))

            End If
            If txtcomm.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES_AGENT_NOTES(lblfile.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomm.Text)
            End If
            LoadGrid(lblfile.Text)

            'lbltaskno.Text = ""
            cbodoc.Text = ""
            cbodoc.SelectedValue = ""
            txtlicence.Text = ""
            lblupload.Text = ""
            chkwaiver.Checked = False
            chkcon.Checked = True
            chkira.Checked = True
            chkkyc.Checked = True

            'dtupload.DbSelectedDate = Date.Now
            ltEmbed.Text = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub


    Protected Sub RadButton3_Click(sender As Object, e As System.EventArgs) Handles RadButton3.Click
        Try
            If HiddenField2.Value = 0 Then
                MyDBAction.Add_Directors(lblfile.Text, (txtdir.Text.ToUpper), txtdiremail.Text, txtdirmob.Text, txtdireid.Text, txtdirepin.Text, Session("username"), HiddenField2.Value)
            Else
                MyDBAction.Add_Directors(lblfile.Text, (txtdir.Text.ToUpper), txtdiremail.Text, txtdirmob.Text, txtdireid.Text, txtdirepin.Text, Session("username"), HiddenField2.Value)
            End If

            SqlAction = "SELECT  [ID],[REF_NO],[NAME],[EMAIL],[MOBILE_NO],[NID_NO],[PIN_NO] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_DIRECTORS] WHERE   Ref_No ='" & lblfile.Text & "' AND IS_ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DIRE.DataSource = MyDatable
                GD_DIRE.DataBind()
                MyDatable = Nothing
            Else
                GD_DIRE.DataSource = Nothing
                GD_DIRE.DataBind()
            End If
            lbldir.Text = "Saved Successfull!"
            txtdir.Text = ""
            txtdiremail.Text = ""
            txtdirmob.Text = ""
            txtdireid.Text = ""
            txtdirepin.Text = ""
            HiddenField2.Value = 0
        Catch ex As Exception
            lbldir.Text = ex.Message
        End Try
    End Sub


    Protected Sub GD_DIRE_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_DIRE.SelectedIndexChanged
        Try
            Dim id As Integer
            HiddenField2.Value = (DirectCast(GD_DIRE.SelectedItems(0), GridDataItem)).GetDataKeyValue("ID").ToString()

            SqlAction = "SELECT  [ID],[REF_NO],[NAME],[EMAIL],[MOBILE_NO],[NID_NO],[PIN_NO] FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_DIRECTORS] WHERE ID='" & HiddenField2.Value & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                txtdir.Text = MyDatable.Rows(0).Item("NAME").ToString()
                txtdireid.Text = MyDatable.Rows(0).Item("NID_NO").ToString()
                txtdiremail.Text = MyDatable.Rows(0).Item("EMAIL").ToString()
                txtdirepin.Text = MyDatable.Rows(0).Item("PIN_NO").ToString()
                txtdirmob.Text = MyDatable.Rows(0).Item("MOBILE_NO").ToString()

            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub RadButton1_Click(sender As Object, e As System.EventArgs) Handles btnsubmit.Click

        Try
            Session("email") = ""
            Session("email_cc") = ""
            If lblfile.Text = "" Then
                lblsub.Text = "Select The File No"
                Exit Sub
            End If
            If chkcompl.Checked = False Then
                lblsub.Text = "Confirm Complete"
                Exit Sub
            End If



            SqlAction = "SELECT TOP 1 [LICENCE_NO]   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WITH(NOLOCK) WHERE LICENCE_NO='" & (txtlicence.Text) & "' and WAIVER='Yes'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then

                UpdateRecord("UPDATE [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] SET  [VERIFIED]=1, [VERIFIED_BY]= '" & Session("username") & "',  [SUBMIT_DATE]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',CODED=1,CODED_BY= '" & Session("username") & "',UPDATE_DATE='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',UPDATED_BY='" & Session("username") & "' where [Ref_No]= '" & lblfile.Text & "'")
                MyDBAction.COMMISSION_AGENTS_UPDATE(lblfile.Text, 1)
                lblsub.Text = "Agent Submitted Successful"
                LoadGrid(lblfile.Text)
                LoadGrid_All()
                lblfile.Text = ""
                Session("CODED") = 0
                chkcompl.Checked = False
                btnsubmit.Enabled = False

            Else

                SqlAction = "SELECT TOP 1 [LICENCE_NO]   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE REF_NO='" & (lblfile.Text) & "' AND  VALID_TO>=GETDATE()"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                    If MyDatable.Rows.Count > 0 Then
                        UpdateRecord("UPDATE [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] SET  AGENT_STATUS='ACTIVE', [VERIFIED]=1, [VERIFIED_BY]= '" & Session("username") & "',  [SUBMIT_DATE]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',CODED=1,CODED_BY= '" & Session("username") & "',UPDATE_DATE='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',UPDATED_BY='" & Session("username") & "' where [Ref_No]= '" & lblfile.Text & "'")

                        MyDBAction.COMMISSION_AGENTS_UPDATE(lblfile.Text, 1)
                        lblsub.Text = "Agent Submitted Successful"
                        LoadGrid(lblfile.Text)
                        LoadGrid_All()
                        lblfile.Text = ""
                        Session("CODED") = 0
                        chkcompl.Checked = False
                        btnsubmit.Enabled = False

                    Else
                        SqlAction = "SELECT TOP 1 [LICENCE_NO]   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE LICENCE_NO='" & (txtlicence.Text) & "' AND  VALID_TO>=convert(date,GETDATE())"
                        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                        If MyDatable.Rows.Count > 0 Then

                            UpdateRecord("UPDATE [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] SET  AGENT_STATUS='ACTIVE', [VERIFIED]=1, [VERIFIED_BY]= '" & Session("username") & "',  [SUBMIT_DATE]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',CODED=1,CODED_BY= '" & Session("username") & "',UPDATE_DATE='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',UPDATED_BY='" & Session("username") & "' where [Ref_No]= '" & lblfile.Text & "'")

                            MyDBAction.COMMISSION_AGENTS_UPDATE(lblfile.Text, 1)
                            lblsub.Text = "Agent Submitted Successful"
                            LoadGrid(lblfile.Text)
                            LoadGrid_All()
                            lblfile.Text = ""
                            Session("CODED") = 0
                            chkcompl.Checked = False
                            btnsubmit.Enabled = False
                        Else
                            lblsub.Text = "You Must Capture Valid Licence details!"
                        End If
                    End If
                SqlAction = "Select  [email],NSM_Name   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_NSM] where active=1"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                    If MyDatable.Rows.Count > 0 Then

                    Session("email_cc") = MyDatable.Rows(0).Item("email").ToString()
                    Dim name As String = MyDatable.Rows(0).Item("NSM_Name").ToString()

                End If
                    MyDatable = Nothing
                    'Session("email") = "mwaniki56@gmail.com"
                    'MyDBAction.COMMISSION_AGENTS_UPDATE(lblfile.Text, 1)
                    Session("to") = Session("email")

                Session("msg") = "This is to notify you that Intemediary Contractual & Licence Information has been registered & updated"
                MailSent = SendLoginDetails(Session("to"), Session("email"), Session("email_cc"))

                lblupload.Text = "File Uploaded Successfully"

            End If
        Catch ex As Exception
            lblsub.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)
    End Sub

 

    Protected Sub cboyear_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboyear.SelectedIndexChanged
        dtLicetart.DbSelectedDate = firstDayOfYear(cboyear.SelectedValue)
        dtLiceend.DbSelectedDate = LastDayOfYear(cboyear.SelectedValue)
    End Sub

    Protected Sub SEARCH_1_Click(sender As Object, e As System.EventArgs) Handles SEARCH_1.Click
        Try
            lblIM.Text = ""
            MyDBAction.IMPORT_NEW_AGENTS(Session("username"))
            LoadGrid_All()
            lblIM.Text = "List Imported Successful!"
        Catch ex As Exception
            lblIM.Text = ex.Message
        End Try
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
            LoginDisplayName = "COMPLIANCE" ' System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
            'LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
            LoginSubject = "COMPLIANCE UPDATE" & ": " & txtname.Text
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear, " & txtname.Text & " </u></b> </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = Session("Header")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & Session("msg") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Licence No:" & txtlicence.Text & "</b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Please use below link to join WAKALAAR</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>https://agents.aar-insurance.com/</b></span>")
            strHTML = strHTML.Append("<br />")
            '
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Email Address: " & txtemail.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>HRMIS Code : " & txtagentno.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Valid To : " & dtLicetart.DbSelectedDate & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Status : VERIFIED </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Updated By : " & Session("FullNames") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Update date : " & Date.Now() & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------Notes--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            'strHTML = strHTML.Append("" & txtcomment.Text & "")
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
End Class
