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
                lblname.Text = ""

                dtLicetart.DbSelectedDate = firstDayOfYear(Year(Date.Now))
                dtLiceend.DbSelectedDate = LastDayOfYear(Year(Date.Now))
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                Session("med") = 0
                Session("Allocate") = 0
                Session("INVOICED") = 0
                'ltEmbed.Text = ""
                txtlicence.Enabled = False
                btnupload.Enabled = False
                LoadGrid()
                'LoadGrid_All()
            Catch ex As Exception

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
    Public Sub LoadGrid()
        GD_CONTRACT_P.DataSource = Nothing
        GD_CONTRACT_P.DataBind()
        GDSEARCH_1.DataSource = Nothing
        GDSEARCH_1.DataBind()
        SqlAction = "SELECT DISTINCT L.[REF_NO],L.[USER_ID],L.[AGENT_NAME],L.[AGENT_TYPE],L.[AGENT_STATUS]   FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] L  INNER JOIN [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] I WITH(NOLOCK) ON I.[REF_NO]=L.[REF_NO] WHERE I.Submitted=0  AND  I.Entry_By='" & Session("username") & "' AND I.Is_Active=1"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDSEARCH_1.DataSource = MyDatable
            GDSEARCH_1.DataBind()
            Session("D_1") = MyDatable
            MyDatable = Nothing
        Else
            GDSEARCH_1.DataSource = Nothing
            GDSEARCH_1.DataBind()
        End If

        SqlAction = "SELECT I.[ID],I.[REF_NO],I.[LICENCE_NO],I.[VALID_FROM],I.[VALID_TO],I.[ENTRY_DATE], I.Status,I.Is_Valid,L.[AGENT_NAME] Name    FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] L  INNER JOIN [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] I WITH(NOLOCK) ON I.[REF_NO]=L.[REF_NO] WHERE I.Submitted=1 AND I.VERIFIED=0  AND  I.Entry_By='" & Session("username") & "' AND I.Is_Active=1"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_CONTRACT_P.DataSource = MyDatable
            GD_CONTRACT_P.DataBind()
            Session("CONTRACT") = MyDatable
            MyDatable = Nothing
        Else
            GD_CONTRACT_P.DataSource = Nothing
            GD_CONTRACT_P.DataBind()
        End If
    End Sub
    Public Sub LoadGrid(ByVal Ref_no As String)
        Try
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()

            SqlAction = "SELECT [REF_NO],[USER_ID],[AGENT_NAME],[AGENT_TYPE],[AGENT_STATUS],Contract_Date  FROM [DB_MASTER_AGENTS].[dbo].[VW_MIS_AGENTS_LISTING] WITH(NOLOCK) WHERE REF_NO = '" & Ref_no & "'"
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

            SqlAction = "SELECT [ID],[REF_NO],[LICENCE_NO],[VALID_FROM],[VALID_TO],[ENTRY_DATE],[USER_ID],Status,Is_Valid  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE REF_NO='" & Trim(Ref_no) & "' AND  Is_Active=1 order by VALID_TO Desc"
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
            SqlAction = "SELECT [DOC_ID],[Ref_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By],LICENCE_NO FROM [Doc_Arc_DB].[dbo].[TBL_MIS_AGENTS_DOCS] WHERE   Ref_No ='" & Ref_no & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DOCS.DataSource = MyDatable
                GD_DOCS.DataBind()
                MyDatable = Nothing
            Else
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
            End If


        Catch ex As Exception
            'lblerr.Text = ex.Message
        End Try
    End Sub
    Protected Sub GD_CONTRACT_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_CONTRACT.DeleteCommand
        Try
            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("Licence_No").ToString()
            lblupload.Text = ""

            SqlAction = "SELECT  [LICENCE_NO]  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE LICENCE_NO='" & HiddenField1.Value & "' AND STATUS<>'VERIFIED' AND ENTRY_BY='" & Session("username") & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                UpdateRecord("UPDATE [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] SET Is_Active=0 where LICENCE_NO='" & HiddenField1.Value & "'")
                UpdateRecord("UPDATE [Doc_Arc_DB].[dbo].[TBL_MIS_AGENTS_DOCS] SET [Active]=0,[Deleted_By]='" & Session("username") & "',[Delete_date]=getdate() where [LICENCE_NO]= '" & HiddenField1.Value & "'")
                lblupload.Text = "Record Deleted successfully!"
                'loadGrid_1(cbocorporate.SelectedValue)
                HiddenField1.Value = ""
                LoadGrid(lblfile.Text)
            Else
                lblupload.Text = "You Cannot Delete Verified Record!"
            End If
 
        Catch ex As Exception
            Dim ErrMsg As String = ex.Message
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
            Dim chkira_1 As String
            Dim chkkyc_1 As String
            Dim chkcon_1 As String
            Dim chkwaiver_1 As String

            lblupload.Text = ""
            lblname.Text = ""
            Session("email") = ""
            lblfile.Text = (DirectCast(GDSEARCH_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("Ref_No").ToString()

            SqlAction = "SELECT  REF_NO,AGENT_NAME,HIER_NAME,AGENT_TYPE,UNIT_CODE,REGION_CODE,SALES_TAX,COMMISSION_RATE,EMAIL,MOBILE_NO,PIN_NO,SEC_MOBILE_NO,EARN_COMMISSION,H_TAX,NSM_CODE,PAY_MODE,ACTIVE,Receive_Date,NID_NO,LICENCE_NO,IRA_Compliance,Contract_Signed,KYC_Compliance,Waiver FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY] WHERE REF_NO='" & lblfile.Text & "' AND TERMINATED=0 AND SUSPENDED=0"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                txtlicence.Text = MyDatable.Rows(0).Item("LICENCE_NO").ToString()
                lblname.Text = MyDatable.Rows(0).Item("AGENT_NAME").ToString()
                Session("email") = MyDatable.Rows(0).Item("EMAIL").ToString()
                'IRA_Compliance,Contract_Signed,KYC_Compliance,Waiver

                chkira_1 = MyDatable.Rows(0).Item("IRA_Compliance").ToString()
                chkkyc_1 = MyDatable.Rows(0).Item("KYC_Compliance").ToString()
                chkcon_1 = MyDatable.Rows(0).Item("Contract_Signed").ToString()
                chkwaiver_1 = MyDatable.Rows(0).Item("Waiver").ToString()
                If chkira_1 = "Yes" Then
                    chkira.Checked = 1
                Else
                    chkira.Checked = 0
                End If
                If chkkyc_1 = "Yes" Then
                    chkkyc.Checked = 1
                Else
                    chkkyc.Checked = 0
                End If
                If chkcon_1 = "Yes" Then
                    chkcon.Checked = 1
                Else
                    chkcon.Checked = 0
                End If
              

                LoadGrid(lblfile.Text)
                txtlicence.Enabled = True
                btnupload.Enabled = True

                SqlAction = " SELECT ADMIN_ID FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_ADMINS]  where WAIVER=1 and MIS_EMP_CODE IN (SELECT EMP_CODE FROM SALES.[dbo].[Employees] WHERE USERNAME='" & Session("username") & "')"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then

                    chkira.Enabled = True
                    chkkyc.Enabled = True
                    chkcon.Enabled = True
                Else

                    chkira.Enabled = True
                    chkkyc.Enabled = True
                    chkcon.Enabled = True

                End If
            Else
                lblupload.Text = "Agent is Not Valid!"
                txtlicence.Enabled = False
                btnupload.Enabled = False
            End If



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

         
            Select Case ext.ToLower
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


            'Session("email") = "jmwaniki@aar.co.ke"

            If chkcon.Checked = False Or chkira.Checked = False Or chkkyc.Checked = False Then

                'SqlAction = " SELECT ADMIN_ID FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_ADMINS]  where WAIVER=1 and MIS_EMP_CODE IN (SELECT EMP_CODE FROM SALES.[dbo].[Employees] WHERE USERNAME='" & Session("username") & "')"
                'MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                'If MyDatable.Rows.Count > 0 Then

                If chkcon.Checked = False And chkira.Checked = False Then
                    Compliance = 1 'Contract=No,IRA=No  
                ElseIf chkcon.Checked = False And chkira.Checked = True Then
                    Compliance = 2 'Contract=No,IRA=Yes   
                ElseIf chkcon.Checked = True And chkira.Checked = False Then
                    Compliance = 3 'Contract=Yes,IRA=No 
                ElseIf chkcon.Checked = True And chkira.Checked = True And chkkyc.Checked = False Then
                    Compliance = 4 'Contract=Yes,IRA=Yes
                ElseIf chkcon.Checked = True And chkira.Checked = True And chkkyc.Checked = True Then
                    lblupload.Text = "Please Remove Waiver!"
                    Exit Sub
                End If

                If Compliance = 1 Then
                    MyDBAction.UPLOAD_File_ADD_LICENCE(lblfile.Text, txtlicence.Text, CDate(dtLicetart.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtLiceend.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), 0, Compliance, KYC)

                Else
                    MyDBAction.UPLOAD_File_DOC_CONTRACT(bytes, filename, contenttype, lblfile.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, Trim(txtlicence.Text.ToUpper))
                    MyDBAction.UPLOAD_File_ADD_LICENCE(lblfile.Text, txtlicence.Text, CDate(dtLicetart.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtLiceend.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), 0, Compliance, KYC)
                End If

                'MyDBAction.COMMISSION_AGENTS_UPDATE(lblfile.Text, 1)
                Session("to") = Session("email")
                Session("email_cc") = ""
                Session("msg") = "This is to notify you that Your Contractual & Licence details have been registered "
                MailSent = SendLoginDetails(Session("to"), Session("email"), Session("email_cc"))
                lblupload.Text = "Licence Updated successful"


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

                If Right(txtlicence.Text, 4) <> cboyear.SelectedValue Then
                    lblupload.Text = "Licence Information & Year do Not Match!"
                    Exit Sub
                End If


                If contenttype <> String.Empty Then
                    Dim fileLocation As String = ""
                    MyDBAction.UPLOAD_File_DOC_CONTRACT(bytes, filename, contenttype, lblfile.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, Trim(txtlicence.Text.ToUpper))
                    'Response.Redirect(Request.Url.AbsoluteUri)
                    MyDBAction.UPLOAD_File_ADD_LICENCE(lblfile.Text, txtlicence.Text, CDate(dtLicetart.DbSelectedDate).ToString("yyyy-MM-dd"), CDate(dtLiceend.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), 0, Compliance, KYC)
                    lblupload.Text = "Updated Successful!"

                    Session("to") = Session("email")
                    Session("email_cc") = ""
                    Session("msg") = "This is to notify you that IRA Licence No  " & txtlicence.Text & " has been updated Successfull.KIndly Verify"
                    MailSent = SendLoginDetails(Session("to"), Session("email"), Session("email_cc"))
                    lblupload.Text = "Updated Successful!"

                Else
                    lblupload.Text = "File format not recognised." _
                & " Upload Image/Word/PDF/Excel formats"
                End If
            End If

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES_AGENT_NOTES(lblfile.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If
            LoadGrid(lblfile.Text)
            'lbltaskno.Text = ""
            lblfile.Text = ""
            txtlicence.Text = ""
            txtcomment.Text = ""
            cbodoc.Text = ""
            lblname.Text = ""
            cbodoc.SelectedValue = ""
            txtlicence.Enabled = False
            btnupload.Enabled = False
            Session("email") = ""
            'dtupload.DbSelectedDate = Date.Now
            ltEmbed.Text = ""
        Catch ex As Exception
            txtcomment.Text = ex.Message
        End Try

    End Sub
    Protected Sub cboyear_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboyear.SelectedIndexChanged
        dtLicetart.DbSelectedDate = firstDayOfYear(cboyear.SelectedValue)
        dtLiceend.DbSelectedDate = LastDayOfYear(cboyear.SelectedValue)
    End Sub


    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)
    End Sub



    Protected Sub GD_CONTRACT_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_CONTRACT.SelectedIndexChanged
        Try
            lblfile.Text = (DirectCast(GDSEARCH_1.SelectedItems(0), GridDataItem)).GetDataKeyValue("LICENCE_NO").ToString()

            SqlAction = "SELECT [ID],[REF_NO],[LICENCE_NO],[VALID_FROM],[VALID_TO],[ENTRY_DATE],[USER_ID],Is_Valid  FROM [DB_MASTER_AGENTS].[dbo].[TBL_MIS_SALES_INTERMEDIARY_LICENCE] WITH(NOLOCK) WHERE REF_NO='" & Trim(lblfile.Text) & "' order by VALID_TO Desc"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                LoadGrid(lblfile.Text)
            Else
                GDSEARCH_1.DataSource = Nothing
                GDSEARCH_1.DataBind()
            End If
        Catch ex As Exception

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
            LoginSubject = "IRA COMPLIANCE" & ":" & lblname.Text
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear, " & lblname.Text & " </u></b> </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = Session("Header")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & Session("msg") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Licence No:" & txtlicence.Text & "</b></span>")
            strHTML = strHTML.Append("<br />")
            'strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Valid Period: " & cboyear.SelectedValue & " </b></span>")
            'strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date : " & Date.Now() & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Forwaded By : " & Session("FullNames") & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------Notes--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & txtcomment.Text & "")
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
