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
                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where DOC_ID='RET09'"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbodoc
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
                    .DataBind()
                End With
                'Session("username") = "joramt"
                loadGrid_N()
            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT  T.File_No, T.Proposer_Name, T.To_Cashier_dt, T.Premium, T.File_Status,T.Business_Type, T.Client_Type, T.Allocated_to, T.eOx_Invoice_No,T.Cashier,c.BRANCH_NAME ,t.Entered_By,t.Walk_in_Client,T.Product,T.Syst FROM   dbo.TBL_MIS_CRM_BUSINESS_TRACKING T WITH (NOLOCK) INNER JOIN COMMISSION.dbo.VW_MIS_AGENTS_LISTING C ON T.Agent_Id = C.USER_ID WHERE (T.Forwarded = 1) AND (T.Ready_For_update = 1) AND (T.Allocated = 1) AND (T.Invoiced = 1) AND (T.Receipted = 0) AND (T.Is_Declined = 0) AND (T.Paid = 0)  AND T.Is_Active=1  and Syst='Clapi' ORDER BY t.WALK_IN_CLIENT DESC"
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
            
            If cboAction.SelectedValue = "C" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET File_Status='AWAITING_PAYMENT', Invoiced=1, Receipted=0, ROP=0,ROP_BY='',Paid_Status='FULL-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")

            ElseIf cboAction.SelectedValue = "RM" Then
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Receipted=0,Invoiced=0, ROP=0,ROP_BY='',Paid_Status='NOT-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")

            End If
          
            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

           

            'Session("email") = "jmwaniki@aar.co.ke"
            MailSent = SendLoginDetails(lblenteredby.Text, Session("email"), Session("cc_email"))

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
            SqlAction = "SELECT Pay_Ref_No,Paid_Amt,[File_No],entered_By,Allocated_to,eOx_Invoice_No,Proposer_Name,ROP_BY,Is_Branch   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "' and Receipted=0 AND ROP=0"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                txtproposer.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                txtrefno.Text = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                txtreceiptamt.Text = MyDatable.Rows(0).Item("Paid_Amt").ToString()
                Session("rop_by") = MyDatable.Rows(0).Item("ROP_By").ToString()
                Session("Is_Branch") = MyDatable.Rows(0).Item("Is_Branch").ToString()
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET ROP=1,ROP_BY='" & Session("username") & "' where [File_No]= '" & FILE_NO.Text & "'")
                loadGrid(FILE_NO.Text)
                Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("cc_email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                End If

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblupdateby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                End If

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


            Else
                SqlAction = "SELECT Pay_Ref_No,Paid_Amt,[File_No],entered_By,Allocated_to,eOx_Invoice_No,Proposer_Name,ROP_BY,Is_Branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "' and Receipted=0 AND ROP=1 and ROP_By='" & Session("username") & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                    lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                    lblupdateby.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                    txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                    txtproposer.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                    txtrefno.Text = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                    txtreceiptamt.Text = MyDatable.Rows(0).Item("Paid_Amt").ToString()
                    Session("Is_Branch") = MyDatable.Rows(0).Item("Is_Branch").ToString()
                    'UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET ROP=1,ROP_BY='" & Session("username") & "' where [File_No]= '" & FILE_NO.Text & "'")

                    loadGrid(FILE_NO.Text)

                    Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("cc_email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                    End If

                    Str = "SELECT EMAIL FROM employees WHERE username='" & lblupdateby.Text & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                    End If

                Else
                    Str = "SELECT ROP_By FROM TBL_MIS_CRM_BUSINESS_TRACKING WHERE File_No='" & ID & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("rop_by") = MyDatatable.Rows(0).Item("ROP_By").ToString()
                        lblerr.Text = "Receipting On Progress by : '" & Session("rop_by") & "'.Kindly select another business"
                    End If


                    GD_DOCS.DataSource = Nothing
                    GD_DOCS.DataBind()
                    GDNOTES.DataSource = Nothing
                    GDNOTES.DataBind()
                    GD_Pay.DataSource = Nothing
                    GD_Pay.DataBind()
                End If
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
            LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
            LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
            'LoginSubject = "BUSINESS ALLOCATION"
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Dear : </b>" & Session("to") & "  </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = "Business Receipting : " & txtproposer.Text & "-" & FILE_NO.Text & ""
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>" & Session("msg") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No    :</b>" & FILE_NO.Text & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date       :</b> " & Date.Now() & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Updated By :</b> " & Session("FullNames") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------<b>Notes</b>--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & txtcomment.Text & "")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------End----------------------------------------------------------")
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("<span style='font-size: 11pt; font-color:RED; font-family: Calibri'><b><i>THIS IS A SYSTEM GENERATED EMAIL.DO NOT REPLY!.</i></b>")
            'Membership Enquiry (membershipenquiry@aar.co.ke)
            strHTML = strHTML.Append("<br />")

            strHTML = strHTML.Append("</table>")
            strHTML = strHTML.Append("</body>")
            strHTML = strHTML.Append("</html>")
            Dim mymail As New Emailing
            MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName, ccemail)
            Session("MailSent") = MailSent
        Catch ex As Exception
            'MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
            MailSent = False
        End Try

        Return MailSent
    End Function
    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click

        Dim MyDatable As New Data.DataTable
        Dim STS As Integer
        Dim aar As Integer = 0
        Dim PROPOSER_ID As String
        Dim PERIOD As String
        Dim FILENO As String
        'ltEmbed.Text = ""
        lblerr.Text = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "You must Select The file!"
                Exit Sub
            End If

            If FL1.PostedFile.FileName = "" Then
                lblerr.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If


        

            Dim filePath As String = FL1.PostedFile.FileName
            Dim filename As String = Path.GetFileName(filePath)
            Dim ext As String = Path.GetExtension(filename)
            Dim contenttype As String = String.Empty
            Dim fs As Stream = FL1.PostedFile.InputStream
            Dim br As New BinaryReader(fs)
            Dim bytes As Byte() = br.ReadBytes(DirectCast(fs.Length, Long))

            Dim app As Integer = 0

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
                Case ".pdf"
                    contenttype = "application/pdf"
                    Exit Select
                Case ".rar"
                    contenttype = "application/zip"
                    Exit Select
                Case ".zip"
                    contenttype = "application/zip"
                    Exit Select
                Case ".eml"
                    contenttype = "application/zip"
                    Exit Select
                Case ".msg"
                    contenttype = "application/zip"
                    Exit Select
            End Select

            If contenttype <> String.Empty Then
                Dim fileLocation As String = ""
                MyDBAction.UPLOAD_File_DOC_INVOIC(bytes, filename, contenttype, FILE_NO.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, "")
                'Response.Redirect(Request.Url.AbsoluteUri)
                'UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Receipt_No='" & txtreceipt.Text & "'  where [File_No]= '" & FILE_NO.Text & "'")

                UPLOAD.ForeColor = System.Drawing.Color.Green

                UPLOAD.Text = "File Uploaded Successfully"

            Else
                UPLOAD.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If
            loadGrid(FILE_NO.Text)



        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

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
