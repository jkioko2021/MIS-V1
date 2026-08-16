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

                Me.Str = "SELECT COUNTY_CODE,COUNTY_NAME from [dbo].[TBL_MIS_COUNTY]"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboCounty As RadComboBox = Me.cboCounty
                cboCounty.Items.Clear()
                cboCounty.DataSource = Me.MyDatatable
                cboCounty.DataTextField = Me.MyDatatable.Columns("COUNTY_NAME").ToString()
                cboCounty.DataValueField = Me.MyDatatable.Columns("COUNTY_CODE").ToString()
                cboCounty.DataBind()

                Me.Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS WHERE ACTIVE=1  ORDER BY AGENT_NAME"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboagent As RadComboBox = Me.cboagent
                cboagent.Items.Clear()
                cboagent.DataSource = Me.MyDatatable
                cboagent.DataTextField = Me.MyDatatable.Columns("AGENT_NAME").ToString()
                cboagent.DataValueField = Me.MyDatatable.Columns("USER_ID").ToString()
                cboagent.DataBind()



                Me.Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE   approved=1 AND Deleted=0 AND DEPARTMENT='NONMEDICAL'"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                Dim cboAllocateto As RadComboBox = Me.cboAllocateto
                cboAllocateto.Items.Clear()
                cboAllocateto.DataSource = Me.MyDatatable
                cboAllocateto.DataTextField = Me.MyDatatable.Columns("EmployeeName").ToString()
                cboAllocateto.DataValueField = Me.MyDatatable.Columns("username").ToString()
                cboAllocateto.DataBind()

                Me.loadGrid_N()
                Me.txtProposer.Enabled = False
                Me.dtreceivedate.Enabled = False
                Me.txtpaid.Enabled = False
                Me.cboBusiness.Enabled = False
                Me.cboclient.Enabled = False
            Catch ex As Exception
                Me.lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to,GI_Category  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1   AND ALLOCATED=0 AND INVOICED=0 AND  Is_Declined=0 AND Business='N' AND Receipted=0 AND Is_Active=1  ORDER BY WALK_IN_CLIENT DESC ,Receive_DT ASC"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDTracking.DataSource = MyDatable
            GDTracking.DataBind()
            Session("DAD_T_N") = MyDatable
            MyDatable = Nothing
        Else
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
        End If
    End Sub

    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T_N")
        GDTracking.DataBind()
    End Sub

    Public Sub loadGrid(ByVal STR As String)
        Dim MyDatable As New Data.DataTable
        GD_DOCS.DataSource = Nothing
        GD_DOCS.DataBind()
        GDNOTES.DataSource = Nothing
        GDNOTES.DataBind()
        Try

            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By],Doc_Ref FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1"
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
        Dim is_br As Integer
        Session("msg") = Nothing
        Dim benefit As String

        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If
            benefit = "YES"
            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                Exit Sub
            End If
            'If cboAction.SelectedValue = "A" And cboAllocateto.SelectedValue = "" Then
            '    lblerr.Text = "Select the Forward To!"
            '    cboAllocateto.Focus()
            '    Exit Sub
            'End If
            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If
            If cboAction.SelectedValue = "RI" Then
                a_to = lblenteredby.Text
            Else
                a_to = cboAllocateto.SelectedValue
            End If


            'If Cbosyst.SelectedValue = "Clapi" And cboAction.SelectedValue = "MU" Then
            '    lblerr.Text = "You cannot allocate this Business to Medical UW!"
            '    Exit Sub

            'End If

            If Session("Is_Declined") = 1 Then
                If cboAction.SelectedValue = "RI" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  File_Status='DECLINED-RETURNED', Allocated=0, Allocated_to='' , Ready_For_update=0,Refund_req=0, where [File_No]= '" & FILE_NO.Text & "'")

                Else
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  File_Status='REFUND-REQUESTED', Allocated=1, Allocated_to= '" & cboAllocateto.SelectedValue & "' where [File_No]= '" & FILE_NO.Text & "'")

                End If

            Else
                If Session("Invoiced") = 1 And cboAction.SelectedValue <> "RI" Then
                    If cboAllocateto.SelectedValue = "" Then
                        lblerr.Text = "Select the user To allocate!"
                        Exit Sub
                    End If
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  Allocated=1, Allocated_to= '" & cboAllocateto.SelectedValue & "',  [Allocate_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',Benefit_Verified='" & benefit & "' where [File_No]= '" & FILE_NO.Text & "'")
                Else


                    MyDBAction.TRACKING_ALLOCATION(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd hh:mm"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, "YES")

                End If
                If txtcomment.Text <> "" Then
                    MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
                End If
                If cboAction.SelectedValue = "A" And is_br = 0 Then
                    Str = "SELECT EMAIL FROM employees WHERE username='" & cboAllocateto.SelectedValue & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("to") = cboAllocateto.Text
                        Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                        Session("msg") = "Kindly note that you have been Allocated the below Business for update!"
                    Else
                        Session("to") = cboAllocateto.Text
                        Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                        Session("msg") = "Kindly note that you have been Allocated the below Business from Branch to complete update process!"

                    End If
                ElseIf cboAction.SelectedValue = "RI" Then
                    Session("to") = lblenteredby.Text
                    Session("email") = Session("email_cc")
                    Session("msg") = "Kindly note that the above business has been returned as Incomplete by the Membership Administrator!"


                End If
            End If
            'Session("email") = "jmwaniki@aar.co.ke"
            MailSent = SendLoginDetails(cboAllocateto.SelectedValue, Session("email"), Session("email_cc"))

            lblerr.Text = "Business Allocated successfully!"
            loadGrid_N()
            txtcomment.Text = ""
            FILE_NO.Text = ""

            txtProposer.Text = ""
            txtNID.Text = ""
            txt_PIN.Text = ""

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


    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            Me.ltEmbed.Text = ""
            Me.FILE_NO.Text = ""
            Me.txtProposer.Text = ""

            Me.cboBusiness.Text = ""
            Me.cboBUS.Text = ""
            Me.cboclient.Text = ""
            Me.lblenteredby.Text = ""
            Me.cboagent.Text = ""
            Me.refno.Text = ""
            Me.txtpaid.Text = ""
            'Me.txtinv.Text = Me.MyDatable.Rows(0)("eOx_Invoice_No").ToString()
            Me.Session("Declined") = ""
            Me.txtpaid.Text = ""
            Me.txtCR12.Text = ""
            Me.cbocategory.Text = ""
            Me.cboSector.Text = ""
            Me.cboPayment.Text = ""

            Me.txtNID.Text = ""
            Me.txt_PIN.Text = ""
            Me.cboCounty.Text = ""
            Me.cborateType.Text = ""
            Me.cboGI_Cat.Text = ""

            Me.ID = CType(Me.GDTracking.SelectedItems(0), GridDataItem).GetDataKeyValue("File_No").ToString()
            Me.SqlAction = "SELECT [File_No],Pay_Ref_No,Paid_Amt,[Proposer_Name],[Family_code],Premium,File_Status,Business,Business_Type,Rate_Type,Receive_dt,entered_By,Agent_id,  Client_Type,Is_Mtiba,Benefit_verified,Benefit_Ver_by,Allocated_to,WALK_IN_CLIENT,eOx_Invoice_No,Is_Declined,Lateral_Movement,CR_12,County_Code,Category,Sector,PAY_MODE,CARD_TYPE,NID,PIN_NO,County_CODE,GI_Category    FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" + Me.ID + "'"
            Me.MyDatable = TryCast(Me.MyDBAction.DBAction(Me.SqlAction, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
            If Me.MyDatable.Rows.Count > 0 Then
                Me.FILE_NO.Text = Me.MyDatable.Rows(0)("File_No").ToString()
                Me.txtProposer.Text = Me.MyDatable.Rows(0)("Proposer_Name").ToString()
                Me.dtreceivedate.DbSelectedDate = Me.MyDatable.Rows(0)("Receive_dt").ToString()
                Me.cboBusiness.SelectedValue = Me.MyDatable.Rows(0)("Business_Type").ToString()
                Me.cboBUS.SelectedValue = Me.MyDatable.Rows(0)("Business").ToString()
                Me.cboclient.SelectedValue = Me.MyDatable.Rows(0)("Client_Type").ToString()
                Me.lblenteredby.Text = Me.MyDatable.Rows(0)("entered_By").ToString()
                Me.cboagent.SelectedValue = Me.MyDatable.Rows(0)("Agent_id").ToString()
                Me.refno.Text = Me.MyDatable.Rows(0)("Pay_Ref_No").ToString()
                Me.txtpaid.Text = Me.MyDatable.Rows(0)("Paid_Amt").ToString()
                'Me.txtinv.Text = Me.MyDatable.Rows(0)("eOx_Invoice_No").ToString()
                Me.Session("Declined") = Me.MyDatable.Rows(0)("Is_Declined").ToString()
                Me.txtpaid.Text = Me.MyDatable.Rows(0)("Paid_Amt").ToString()
                Me.txtCR12.Text = Me.MyDatable.Rows(0)("CR_12").ToString()
                Me.cbocategory.SelectedValue = Me.MyDatable.Rows(0)("Category").ToString()
                Me.cboSector.SelectedValue = Me.MyDatable.Rows(0)("Sector").ToString()
                Me.cboPayment.SelectedValue = Me.MyDatable.Rows(0)("PAY_MODE").ToString()

                Me.txtNID.Text = Me.MyDatable.Rows(0)("NID").ToString()
                Me.txt_PIN.Text = Me.MyDatable.Rows(0)("PIN_NO").ToString()
                Me.cboCounty.SelectedValue = Me.MyDatable.Rows(0)("County_Code").ToString()
                Me.cborateType.SelectedValue = Me.MyDatable.Rows(0)("Rate_Type").ToString()
                Me.cboGI_Cat.SelectedValue = Me.MyDatable.Rows(0)("GI_Category").ToString()
                Me.loadGrid(Me.FILE_NO.Text)
                Me.Str = "SELECT EMAIL FROM employees WHERE username='" + Me.lblenteredby.Text + "'"
                Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                If Me.MyDatatable.Rows.Count > 0 Then
                    Me.Session("email_CC") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
                Else
                    Me.Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" + Me.lblenteredby.Text + "'"
                    Me.MyDatatable = TryCast(Me.MyDBAction.DBAction(Me.Str, DataManagement.DBActionType.DataTable, "", Nothing), DataTable)
                    If Me.MyDatatable.Rows.Count > 0 Then
                        Me.Session("email_CC") = Me.MyDatatable.Rows(0)("EMAIL").ToString()
                    Else
                        Me.Session("email_CC") = "relationship-managers@aar.co.ke"
                    End If
                End If
                Me.P1.Enabled = False
            End If
        Catch ex As Exception
            Me.lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            ltEmbed.Text = ""
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=0 AND Ready_For_Update=0   AND Business='N'  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Allocated_to  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=0 AND Ready_For_Update=0  AND Business='N'  AND Is_Active=1"
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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Dear : </b>" & lblenteredby.Text & "  </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = "Document Verification :" & txtProposer.Text & "-" & FILE_NO.Text & ""
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>" & Session("msg") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No    :</b>" & FILE_NO.Text & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date       :</b> " & Date.Now() & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Business    :</b> Non-Medical </span>")
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


End Class
