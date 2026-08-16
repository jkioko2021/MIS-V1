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

        If Not Me.IsPostBack Then
            Try
                Me.dtreceivedate.DbSelectedDate = DateTime.Now
                Me.dtreceivedate.Enabled = False
                Me.ltEmbed.Text = ""
                Me.HiddenField1.Value = 0
                Me.Session("empcode") = Nothing
                Me.Session("agentemail") = Nothing
                Me.Str = "SELECT [Sector_Code],[Sector_Name] FROM [dbo].[TBL_MIS_CRM_SECTORS]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboSector As RadComboBox = Me.cboSector
                cboSector.Items.Clear()
                cboSector.DataSource = Me.MyDatatable
                cboSector.DataTextField = Me.MyDatatable.Columns("Sector_Name").ToString()
                cboSector.DataValueField = Me.MyDatatable.Columns("Sector_Code").ToString()
                cboSector.DataBind()

                Me.Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS WHERE ACTIVE=1  ORDER BY AGENT_NAME"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboagent As RadComboBox = Me.cboagent
                cboagent.Items.Clear()
                cboagent.DataSource = Me.MyDatatable
                cboagent.DataTextField = Me.MyDatatable.Columns("AGENT_NAME").ToString()
                cboagent.DataValueField = Me.MyDatatable.Columns("USER_ID").ToString()
                cboagent.DataBind()

                Me.Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE   approved=1 AND Deleted=0 AND Department='MEMBERSHIP'"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboAllocateto As RadComboBox = Me.cboAllocateto
                cboAllocateto.Items.Clear()
                cboAllocateto.DataSource = Me.MyDatatable
                cboAllocateto.DataTextField = Me.MyDatatable.Columns("EmployeeName").ToString()
                cboAllocateto.DataValueField = Me.MyDatatable.Columns("username").ToString()
                cboAllocateto.DataBind()

                Me.Str = "SELECT COUNTY_CODE,COUNTY_NAME from [dbo].[TBL_MIS_COUNTY]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboCounty As RadComboBox = Me.cboCounty
                cboCounty.Items.Clear()
                cboCounty.DataSource = Me.MyDatatable
                cboCounty.DataTextField = Me.MyDatatable.Columns("COUNTY_NAME").ToString()
                cboCounty.DataValueField = Me.MyDatatable.Columns("COUNTY_CODE").ToString()
                cboCounty.DataBind()
                Me.loadGrid_N()
                Me.txtProposer.Enabled = False
                Me.cboBusiness.Enabled = False
                Me.cboclient.Enabled = False
                Me.txtCR12.Enabled = False
                Me.cboagent.Enabled = False
                Me.cboPayment.Enabled = False
                Me.cboCard.Enabled = False
                Me.cboCounty.Enabled = False
                Me.cbocategory.Enabled = False
                Me.cboSector.Enabled = False
                Me.cboBUS.Enabled = False
                Me.cborateType.Enabled = False
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End If


    End Sub
    Public Sub loadGrid_N()
        'SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R' and Rate_Type='C' AND ALLOCATED=0 AND Is_Declined=0 AND Business='M' AND Is_Active=1"
        GDTrackingRef.DataSource = Nothing
        GDTrackingRef.DataBind()
        SqlAction = "SELECT [File_No],[Proposer_Name],Forward_Date,Premium,File_Status,Business_Type,Client_Type,is_branch  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R'  AND ALLOCATED=0  AND Business='M' and  is_clapi=0 AND Is_Active=1"
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
        SqlAction = "SELECT  [Refund_No],[File_No],[Amount_Paid],[Refund_Amt] ,[Payee_Name],[Payee_eMail],[Payee_Mobile],[Refund_Status],[Refund_Type],[Request_Dt],Entered_By,Client_Type FROM [CRM].[dbo].[TBL_MIS_BUSINESS_TRACKING_REFUNDS] WITH (NOLOCK) WHERE Requested=1 and Allocated =0  AND Is_Active=1 and Client_Type<>'RET'"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDTrackingRef.DataSource = MyDatable
            GDTrackingRef.DataBind()
            Session("DAD_T") = MyDatable
            MyDatable = Nothing

        Else
            GDTrackingRef.DataSource = Nothing
            GDTrackingRef.DataBind()
        End If
    End Sub



    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        GD_DOCS.DataSource = Nothing
        GD_DOCS.DataBind()
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        Try

            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1"
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
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnforward_Click(sender As Object, e As System.EventArgs) Handles btnforward.Click
        Dim a_to As String = ""
        Dim VER As String = "NO"
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                Exit Sub
            End If
            If cboAllocateto.SelectedValue = "" And cboAction.SelectedValue = "A" Then
                lblerr.Text = "Select the Forward To!"
                Exit Sub
            End If
            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If
            If CboProd.SelectedValue = "" Then
                lblerr.Text = "Select Product!"
                Exit Sub
            End If


            'If Cbosyst.SelectedValue = "Clapi" And cboAction.SelectedValue = "MU" Then
            '    lblerr.Text = "You cannot allocate this Business to Medical UW"
            '    Exit Sub

            'End If

            If cboAction.SelectedValue = "RI" Then
                a_to = lblenteredby.Text
            Else
                a_to = cboAllocateto.SelectedValue
            End If
            If cboclient.SelectedValue = "C" Then
                cborateType.SelectedValue = "C"
            End If

            If cborateType.SelectedValue = "C" And (cboBusiness.SelectedValue = "R" Or cboBusiness.SelectedValue = "N") Then
                VER = "NO"
            Else
                VER = "YES"
            End If

            UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET   Product='" & CboProd.Text & "'  where [File_No]= '" & FILE_NO.Text & "'")

            'If CboProd.SelectedValue = "S" Then
            '    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET syst='" & Cbosyst.Text & "', Product='" & CboProd.Text & "',Forwarded = 1,Ready_For_update = 1,Allocated = 1,Invoiced = 1,Receipted = 0,Is_Declined = 0,Paid = 1,Allocated_to= 'admin',[Allocate_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',Benefit_Verified='YES' where [File_No]= '" & FILE_NO.Text & "'")
            'ElseIf CboProd.SelectedValue = "T" Then
            '    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  syst='" & Cbosyst.Text & "', Product='" & CboProd.Text & "'  where [File_No]= '" & FILE_NO.Text & "'")
            'End If

            MyDBAction.TRACKING_ALLOCATION(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, VER)

            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

            Str = "SELECT EMAIL FROM employees WHERE username='" & cboAllocateto.SelectedValue & "'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatatable.Rows.Count > 0 Then

                Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                Session("msg") = "Kindly note that you have been Allocated the below Business for update.Please await for benefit verification."
            End If
            Session("to") = ""
            If cborateType.SelectedValue = "C" And cboAction.SelectedValue = "A" And (cboBusiness.SelectedValue = "R" Or cboBusiness.SelectedValue = "N") Then
                Session("to") = cboAllocateto.Text
                MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
                Session("to") = "Pricing Team"
                UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET To_Pricing_Dt='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  File_Status='BENEFIT VERIFICATION',Allocate_Dt='' where [File_No]= '" & FILE_NO.Text & "'")
                Session("msg") = "Kindly note that the above client has been Allocated to  '" & cboAllocateto.Text & "' for update.Kindly verify the benefits and attach Approved rate matrix!"
                MailSent = SendLoginDetails("Pricing Team", "Quotations@aar.co.ke", Session("cc_email"))

            ElseIf cboAction.SelectedValue = "A" And (cboBusiness.SelectedValue <> "R" Or cboBusiness.SelectedValue <> "N") Then
                Session("to") = cboAllocateto.Text
                Session("msg") = "Kindly note that the above client has been Allocated to  '" & cboAllocateto.Text & "' for update"
                MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
            ElseIf cboAction.SelectedValue = "RI" Then
                Session("email") = Session("cc_email")
                Session("to") = lblenteredby.Text
                Session("msg") = "Kindly note that the above business has been returned as Incomplete From membership!"
                MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
            ElseIf cboAction.SelectedValue = "MU" Then
                Session("to") = "Medical Team"
                Session("email") = "medicalunderwriting@aar.co.ke"
                Session("msg") = "Kindly note that the above business has been submitted for medical vetting"
                MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("cc_email"))
            End If

            'Session("email") = "jmwaniki@aar.co.ke"

            lblerr.Text = "Business updated successfully!"
            loadGrid_N()
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()
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

    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            Me.ltEmbed.Text = ""
            Me.HiddenField1.Value = 1
            Me.Session("Is_Branch") = 0
            Me.ID = CType(Me.GDTracking.SelectedItems(0), GridDataItem).GetDataKeyValue("File_No").ToString()
            Me.SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business,Business_Type,Receive_dt,entered_By,Agent_id,CR_12,County_Code,Category,Sector,PAY_MODE,CARD_TYPE,  Client_Type,Is_Mtiba,Rate_Type,Is_IPF,Is_Branch   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" + Me.ID + "'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.FILE_NO.Text = Me.MyDatable.Rows(0)("File_No").ToString()
                Me.txtProposer.Text = Me.MyDatable.Rows(0)("Proposer_Name").ToString()
                Me.cboBUS.SelectedValue = Me.MyDatable.Rows(0)("Business").ToString()
                Me.dtreceivedate.DbSelectedDate = Me.MyDatable.Rows(0)("Receive_dt").ToString()
                Me.cboBusiness.SelectedValue = Me.MyDatable.Rows(0)("Business_Type").ToString()
                Me.cboclient.SelectedValue = Me.MyDatable.Rows(0)("Client_Type").ToString()
                Me.lblenteredby.Text = Me.MyDatable.Rows(0)("entered_By").ToString()
                Me.cboagent.SelectedValue = Me.MyDatable.Rows(0)("Agent_id").ToString()
                Me.cborateType.SelectedValue = Me.MyDatable.Rows(0)("Rate_Type").ToString()
                Me.txtCR12.Text = Me.MyDatable.Rows(0)("CR_12").ToString()
                Me.cbocategory.SelectedValue = Me.MyDatable.Rows(0)("Category").ToString()
                Me.cboSector.SelectedValue = Me.MyDatable.Rows(0)("Sector").ToString()
                Me.cboPayment.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()
                Me.cboCard.SelectedValue = Me.MyDatable.Rows(0)("CARD_TYPE").ToString()
                Me.cboCounty.SelectedValue = Me.MyDatable.Rows(0)("County_Code").ToString()
                Me.loadGrid(Me.FILE_NO.Text)
                Me.Str = "SELECT EMAIL FROM employees WHERE username='" + Me.lblenteredby.Text + "'"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If Me.MyDatatable.Rows.Count > 0 Then
                    Me.Session("cc_email") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
                Else
                    Me.Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" + Me.lblenteredby.Text + "'"
                    Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    If Me.MyDatatable.Rows.Count > 0 Then
                        Me.Session("cc_email") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
                    Else
                        Me.Session("cc_email") = "relationship-managers@aar.co.ke"
                    End If
                End If
            End If
            Me.btnupdate.Enabled = False
            Me.txtProposer.Enabled = False
            Me.cboBusiness.Enabled = False
            Me.cboclient.Enabled = False
            Me.txtProposer.Enabled = False
            Me.dtreceivedate.Enabled = False
            Me.cboCard.Enabled = False
            Me.cboBusiness.Enabled = False
            Me.cboclient.Enabled = False
            Me.txtCR12.Enabled = False
            Me.cbocategory.Enabled = False
            Me.cboBUS.Enabled = False
            Me.cboAction.SelectedValue = ""
            Me.cboAllocateto.SelectedValue = ""
            Me.txtcomment.Text = ""
        Catch ex As Exception
            Me.lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            ltEmbed.Text = ""
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R'  AND ALLOCATED=0  AND Business='M' AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=1 AND Ready_For_Update=1 AND  Client_Type<>'R'  AND ALLOCATED=0  AND Business='M' AND Is_Active=1"
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

    Protected Sub cboAction_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboAction.SelectedIndexChanged
        cboAllocateto.SelectedValue = ""
        If cboAction.SelectedValue = "RI" Then
            cboAllocateto.Enabled = False
      
        ElseIf cboAction.SelectedValue = "A" Then
            cboAllocateto.Enabled = True
            Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department='MEMBERSHIP'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboAllocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
        End If

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
            'LoginDisplayName = System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()
            LoginDisplayName = "Business Allocation" 'System.Configuration.ConfigurationManager.AppSettings("LoginDisplayName").Trim()

            'LoginSubject = System.Configuration.ConfigurationManager.AppSettings("LoginSubject").Trim()
            LoginSubject = "Business Allocation"
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
            MessageSubject = "Membership Status :" & txtProposer.Text & ""
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>" & Session("msg") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No    :</b>" & FILE_NO.Text & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Client Name:</b> " & txtProposer.Text & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date       :</b> " & Date.Now() & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Medical underwriter :</b> " & Session("FullNames") & " </span>")
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


    Protected Sub GDTrackingRef_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTrackingRef.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then

            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("Refund_Type")
            If myCell.Text = "DECLINE" Then
                dataItem.BackColor = Drawing.Color.Red
            End If
        End If
    End Sub
    Protected Sub GDTracking_ItemDataBound(ByVal s As Object, ByVal e As GridItemEventArgs) Handles GDTracking.ItemDataBound
        If TypeOf e.Item Is GridDataItem Then
            Dim dataItem As GridDataItem = e.Item
            Dim myCell As TableCell = dataItem("Is_Branch")
            If myCell.Text = 1 Then
                dataItem.BackColor = Drawing.Color.YellowGreen
            End If
        End If
    End Sub




    Protected Sub btnedit_Click(sender As Object, e As EventArgs) Handles btnedit.Click
        Me.HiddenField1.Value = 1
        Me.txtProposer.Enabled = False
        Me.btnupdate.Enabled = True
        Me.txtProposer.Enabled = False
        Me.cborateType.Enabled = True
        Me.cboBusiness.Enabled = True
        Me.cboclient.Enabled = True
        Me.txtProposer.Enabled = False
        Me.dtreceivedate.Enabled = False
        Me.cboCard.Enabled = True
        Me.cboBusiness.Enabled = False
        Me.txtCR12.Enabled = False
        Me.cbocategory.Enabled = False
        Me.cboBUS.Enabled = False
    End Sub

    Protected Sub btnupdate_Click(sender As Object, e As EventArgs) Handles btnupdate.Click
        Try
            Me.UpdateRecord(String.Concat(New String() {"UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Business_type='", Me.cboBusiness.SelectedValue, "', Rate_type='", Me.cborateType.SelectedValue, "', Client_Type='", Me.cboclient.SelectedValue, "'  where [File_No]= '", Me.FILE_NO.Text, "'"}))
            Me.lblerr.Text = "Saved Successful"
            Me.loadGrid_N()
        Catch ex As Exception
            Me.lblerr.Text = ex.Message
        End Try
    End Sub
End Class
