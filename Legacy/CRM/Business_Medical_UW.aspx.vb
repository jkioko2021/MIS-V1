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
                ltEmbed.Text = ""
                Dim unit_code As String = ""
                Dim region_code As String = ""
                dtreceivedate.DbSelectedDate = Date.Now
                dtreceivedate.Enabled = False
                Session("DAD_T") = Nothing
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                dtdx.DbSelectedDate = Date.Now()
                dtafollow.DbSelectedDate = DateAdd(DateInterval.Month, 1, Date.Now())

                Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS WHERE ACTIVE=1  ORDER BY AGENT_NAME" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboagent
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("AGENT_NAME").ToString
                    .DataValueField = MyDatatable.Columns("USER_ID").ToString
                    .DataBind()
                End With

                loadGrid_N()

                Str = "SELECT DISTINCT [Code],[Name]  FROM [dbo].[TBL_MIS_CRM_HPC_DISEASES] ORDER BY Name asc" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbocomor
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Name").ToString
                    .DataValueField = MyDatatable.Columns("Code").ToString
                    .DataBind()
                End With

                Str = " SELECT  [Src_Code],[Src_Name] FROM [CRM].[dbo].[TBL_MIS_CRM_HPC_SOURCE]" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbosrc
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("Src_Code").ToString
                    .DataValueField = MyDatatable.Columns("Src_Name").ToString
                    .DataBind()
                End With
                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ]" ' where DOC_ID In ('RET30','RET35','RET45') order by DOC_ID asc"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbodoc
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
                    .DataBind()
                End With
                Session("empcode") = Nothing
                Session("agentemail") = Nothing

                chkupdate.Checked = True
                txtProposer.Enabled = False
                txtFamily.Enabled = False
                dtreceivedate.Enabled = False
                txtpremium.Enabled = False
                cboBusiness.Enabled = False
                cboclient.Enabled = False

            Catch ex As Exception
                lblerr.Text = ex.Message
            End Try
        End If

    End Sub
    Protected Sub GD_Revert_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_Revert.PageIndexChanged
        GD_Revert.CurrentPageIndex = e.NewPageIndex
        GD_Revert.DataSource = Session("DAD_T_R")
        GD_Revert.DataBind()
    End Sub
    Protected Sub GDTracking_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GD_Revert.PageIndexChanged
        GDTracking.CurrentPageIndex = e.NewPageIndex
        GDTracking.DataSource = Session("DAD_T")
        GDTracking.DataBind()
    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT Product,Syst, [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_by  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Medical_UW=1 AND Ready_For_update=0 AND Is_Declined=0  AND Is_Active=1"
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

        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_by  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE  Is_Active=1 and MU_Revert=1"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GD_Revert.DataSource = MyDatable
            GD_Revert.DataBind()
            Session("DAD_T_R") = MyDatable
            MyDatable = Nothing
        Else
            GD_Revert.DataSource = Nothing
            GD_Revert.DataBind()
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
        Dim revert As Integer = 0
        Dim Lateral_Movement As Integer = 0
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If cboAction.SelectedValue = "" Then
                lblerr.Text = "Select the Action!"
                Exit Sub
            End If
            If chkrevert.Checked = True Then
                revert = 1
            Else
                revert = 0

            End If
            If chkwaiver.Checked = True Then
                Lateral_Movement = 1
            Else
                Lateral_Movement = 0

            End If

            If txtcomment.Text = "" Then
                lblerr.Text = "Enter short notes!"
                Exit Sub
            End If
            MyDBAction.TRACKING_ALLOCATION_UW(FILE_NO.Text, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), a_to, txtcomment.Text, cboAction.SelectedValue, revert, Lateral_Movement)
            UpdateRecord("UPDATE [CRM].[dbo].[TBL_MIS_CRM_MED_UW] SET [Med_UW_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "' WHERE [File_No]= '" & FILE_NO.Text & "'")


            If (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "CL") Then
                If cbopayment.SelectedValue = "FULL-PAID" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='FULL-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")
                ElseIf cbopayment.SelectedValue = "PART-PAID" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='PART-PAID',Paid=1 where [File_No]= '" & FILE_NO.Text & "'")
                ElseIf cbopayment.SelectedValue = "NOT-PAID" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',  Paid_Status='NOT-PAID',Paid=0  where [File_No]= '" & FILE_NO.Text & "' and Syst='Clapi'")
                Else
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET  Invoice_Date='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "', Paid_Status='FULL-PAID',Paid=1  where [File_No]= '" & FILE_NO.Text & "'")
                End If
            End If
            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If
            If cboAction.SelectedValue = "F" Then
                Session("msg") = "Kindly note that the above business has been Approved  for update!"
            ElseIf cboAction.SelectedValue = "RI" Then
                Session("msg") = "Kindly note that the above business has been returned as Incomplete  by medical underwriter!"
            ElseIf cboAction.SelectedValue = "H" Then
                Session("msg") = "Kindly note that the above business has been put on Hold by medical underwriter!"
            ElseIf cboAction.SelectedValue = "D" Then
                Session("msg") = "Kindly note that the above business has been DECLINED by  medical underwriter!"
                'TRACKING_ALLOCATION_DECLINE

            End If

            ' 'Session("email") = "jmwaniki@aar.co.ke"
            MailSent = SendLoginDetails(lblenteredby.Text, Session("email"), Session("email_cc"))

            lblerr.Text = "Business updated successfully!"
            loadGrid_N()
            FILE_NO.Text = ""
            chkwaiver.Checked = False
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
            HiddenField1.Value = 1
            ltEmbed.Text = ""
            Dim action_by As String = ""
            FILE_NO.Text = ""
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Receive_dt,entered_By,Agent_id,Doc_Ver_By,Allocated_to,  Client_Type,Is_Mtiba,Lateral_Movement   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                txtProposer.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                txtFamily.Text = MyDatable.Rows(0).Item("Family_code").ToString()
                dtreceivedate.DbSelectedDate = MyDatable.Rows(0).Item("Receive_dt").ToString()
                txtpremium.Text = MyDatable.Rows(0).Item("Premium").ToString()
                cboBusiness.SelectedValue = MyDatable.Rows(0).Item("Business_Type").ToString()
                cboclient.SelectedValue = MyDatable.Rows(0).Item("Client_Type").ToString()
                lblenteredby.Text = MyDatable.Rows(0).Item("entered_By").ToString()
                chkmtiba.Checked = MyDatable.Rows(0).Item("Is_Mtiba").ToString()
                cboagent.SelectedValue = MyDatable.Rows(0).Item("Agent_id").ToString()
                action_by = MyDatable.Rows(0).Item("Doc_Ver_By").ToString()
                allocatedto.Text = MyDatable.Rows(0).Item("Allocated_to").ToString()
                chkwaiver.Checked = MyDatable.Rows(0).Item("Lateral_Movement").ToString()

                loadGrid(FILE_NO.Text)

                Str = "SELECT EMAIL FROM employees WHERE username='" & lblenteredby.Text & "'" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                If MyDatatable.Rows.Count > 0 Then
                    Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                    Session("email_CC") = "relationship-managers@aar.co.ke"
                Else
                    Str = "SELECT EMAIL FROM SALES.dbo.employees WHERE username='" & lblenteredby.Text & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                        Session("email_CC") = "relationship-managers@aar.co.ke"
                    End If

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
            GD_Revert.DataSource = Nothing
            GD_Revert.DataBind()
            ltEmbed.Text = ""
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Forwarded=1   AND MU_Revert=0 "
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%'  AND Forwarded=1 AND   MU_Revert=0 "
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
                GD_Revert.DataSource = Nothing
                GD_Revert.DataBind()

                If cbosearch.SelectedValue = "F" Then
                    SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_by  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE  Is_Active=1 and MU_Revert=1 and File_No like '%" & txtsearch.Text & "%'"

                ElseIf cbosearch.SelectedValue = "P" Then
                    SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_by  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE  Is_Active=1 and MU_Revert=1 and  Proposer_Name like '%" & txtsearch.Text & "%'"

                End If
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    GD_Revert.DataSource = MyDatable
                    GD_Revert.DataBind()
                    Session("DAD_T_R") = MyDatable
                    MyDatable = Nothing
                Else
                    GDTracking.DataSource = Nothing
                    GDTracking.DataBind()
                    GD_Revert.DataSource = Nothing
                    GD_Revert.DataBind()
                End If

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
            MessageSubject = " Medical Vetting Status :" & FILE_NO.Text & ""
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

    Protected Sub GD_Revert_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_Revert.SelectedIndexChanged
        Try
            HiddenField1.Value = 1
            ltEmbed.Text = ""
            GDTracking.DataSource = Nothing
            GDTracking.DataBind()
            Dim action_by As String = ""
            FILE_NO.Text = ""
            ID = (DirectCast(GD_Revert.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Receive_dt,entered_By,Agent_id,Doc_Ver_By,Allocated_to,  Client_Type,Is_Mtiba   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                txtmemno.Text = MyDatable.Rows(0).Item("File_No").ToString()
                txtname.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                txtprop.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                'cboclient.SelectedValue = MyDatatable.Rows(0).Item("Client_Type").ToString()
                'txtemail.Text = MyDatatable.Rows(0).Item("MEMBER_PRI_EMAIL").ToString()
                'txtmobile.Text = MyDatatable.Rows(0).Item("MEMBER_PRI_MOBILE").ToString()
            End If

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

 

    Protected Sub cmdsave_Click(sender As Object, e As System.EventArgs) Handles cmdsave.Click
        Try
            Dim adm_status As String = ""
            Dim case_status As String = ""
            Dim updated As Integer = 1
            HiddenField1.Value = 0
            lblerr.Text = ""
            If txtname.Text = "" Then
                lblerr.Text = "You Must Enter the Member name"
                Exit Sub
            End If
            If txtprop.Text = "" Then
                lblerr.Text = "You Must Enter the Proposer name"
                Exit Sub
            End If
            If cboclient_1.SelectedValue = "" Then
                lblerr.Text = "You Must Select Client Type"
                Exit Sub
            End If
            If txtmemno.Text = "" Then
                lblerr.Text = "You Must Enter the Member Number"
                Exit Sub
            End If

            If chkupdate.Checked = True Then
                updated = 0
            Else
                updated = 1
            End If

            MyDBAction.HPC_reg(Trim(txtmemno.Text), Trim(txtname.Text), Trim(txtprop.Text), cboclient.SelectedValue, Trim(txtother.Text), Trim(txtmobile.Text), Trim(txtemail.Text), CDate(dtafollow.DbSelectedDate).ToString("yyyy-MM-dd"), Session("UserName").ToString, 0, updated, cbosrc.SelectedValue)
            UpdateRecord("UPDATE [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET  MU_Revert=0 WHERE [File_No]= '" & FILE_NO.Text & "'")
           

            If txtnotes.Text <> "" Then
                MyDBAction.TRACKING_HPC_MESSAGES(Trim(txtmemno.Text), cbocomor.SelectedValue, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtnotes.Text, "NOTES")
            End If
            If cbocomor.SelectedValue <> "" Then
                MyDBAction.TRACKING_HPC_COMORB(CDate(dtdx.DbSelectedDate).ToString("yyyy-MM-dd"), cbocomor.SelectedValue, Trim(txtmemno.Text), Session("username"), CDate(dtdx.DbSelectedDate).ToString("yyyy-MM-dd"), Trim(txtother.Text), Trim(txtother.Text))
            End If

            Str = "SELECT R.Code_Id, R.Member_No, R.Member_Name,   R.Entered_by, R.Entry_dt,r.Followup_Dt FROM    [dbo].[TBL_MIS_CRM_HPC_TRACKING]  R  WITH(NOLOCK)  WHERE R.Member_No='" & txtmemno.Text & "'"
            'Str = "SELECT [Case_No] ,[Admission_Dt],[Member_No],[Transfer_To_Provider],[Admission_Status],[Case_Status],[Pre_Auth_Amt],[Entered_by],[Entry_date]  FROM [CRM].[dbo].[TBL_MIS_CRM_COV_REGISTER] WHERE Member_No='" & txtmemno.Text & "'"
            MyDatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GDCASE.DataSource = MyDatable
                GDCASE.DataBind()
            End If


            lblerr.Text = "Closed Successfully!"
            loadGrid_N()

            HiddenField1.Value = 0
            FILE_NO.Text = ""
            lblcode.Text = ""
            txtnotes.Text = ""
            dtdx.DbSelectedDate = Date.Now()
            cbocomor.SelectedValue = ""
            txtname.Text = ""
            txtmemno.Text = ""
            txtprop.Text = ""
            txtemail.Text = ""
            txtmobile.Text = ""
            FILE_NO.Text = ""
            cboclient.SelectedValue = ""
            txtother.Text = ""
            chkupdate.Checked = True
            lblcode.Enabled = True
            txtnotes.Enabled = True
            dtdx.Enabled = True
            cbocomor.Enabled = True
            txtname.Enabled = True
            txtmemno.Enabled = True
            txtprop.Enabled = True
            cboclient.Enabled = True
            txtother.Enabled = True

            cmdsave.Enabled = True
            cmdsave.Enabled = True

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
 
    Protected Sub search_Click(sender As Object, e As System.EventArgs) Handles search.Click
        If cbosearch_1.SelectedValue = "M" Then
            SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_by  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No like '%" & txtsearch_1.Text & "%'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Revert.DataSource = MyDatable
                GD_Revert.DataBind()
                Session("DAD_T_R") = MyDatable
                MyDatable = Nothing
            Else
                GD_Revert.DataSource = Nothing
                GD_Revert.DataBind()
            End If

        ElseIf cbosearch_1.SelectedValue = "N" Then
            SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type,Entered_by  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name like '%" & txtsearch_1.Text & "%'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_Revert.DataSource = MyDatable
                GD_Revert.DataBind()
                Session("GD_1_T") = MyDatable
                MyDatable = Nothing
            Else
                GD_Revert.DataSource = Nothing
                GD_Revert.DataBind()
            End If
        End If
    End Sub
    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click
        Dim MyDatable As New Data.DataTable
        Dim STS As Integer
        Dim aar As Integer = 0
        Dim PROPOSER_ID As String
        Dim PERIOD As String
        Dim FILENO As String

        lblupload.Text = ""
        'ltEmbed.Text = ""
        Try
            If FILE_NO.Text = "" Then
                lblerr.Text = "You must Select The file!"
                Exit Sub
            End If

            If cbodoc.SelectedValue <> "RET45" Then
                If (Len(Trim(txtinv.Text)) > 25 Or Len(Trim(txtinv.Text)) < 20) And (cboAction.SelectedValue = "C" Or cboAction.SelectedValue = "RM") Then
                    lblerr.Text = "Enter a single Invoice No."
                    txtinv.Focus()
                    txtinv.BackColor = Drawing.Color.Red
                    Exit Sub
                End If
            End If


            If FL1.PostedFile.FileName = "" Then
                lblerr.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If
            If cbodoc.Text = "" Then
                lblerr.Text = "You must Select Document title!"
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
            End Select

            If contenttype <> String.Empty Then
                Dim fileLocation As String = ""
                MyDBAction.UPLOAD_File_DOC_INVOIC(bytes, filename, contenttype, FILE_NO.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, Trim(txtinv.Text))
                'Response.Redirect(Request.Url.AbsoluteUri)


                If cbodoc.SelectedValue = "RET35" Then
                    MyDBAction.TRACKING_CREDIT_NOTES(FILE_NO.Text, Trim(txtinv.Text.ToUpper), txtamount.Text, Session("username"), lblenteredby.Text, CDate(Date.Now).ToString("yyyy-MM-dd"))
                ElseIf cbodoc.SelectedValue = "RET30" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET eOx_Invoice_No='" & Trim(txtinv.Text) & "',Policy_Code='" & Trim(txtpolicy.Text) & "' where [File_No]= '" & FILE_NO.Text & "'")
                End If

                SqlAction = "SELECT [eOx_Invoice_No]   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & FILE_NO.Text & "'"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                If MyDatable.Rows.Count > 0 Then
                    txtinv.Text = MyDatable.Rows(0).Item("eOx_Invoice_No").ToString()
                End If
                lblupload.ForeColor = System.Drawing.Color.Green
                lblupload.Text = "File uploaded successfully"
            Else
                lblupload.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If
            loadGrid(FILE_NO.Text)



        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
End Class
