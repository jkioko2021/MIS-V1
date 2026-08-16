Imports System.Data
Imports System.Data.OleDb
Imports System.Data.SqlClient
Imports System.IO
Imports System.Reflection.Emit
Imports System.Web.Configuration
Imports System.Xml
Imports DocManage
Imports DocManage.DataManagement
Imports Mymail
Imports Telerik.Web.UI
Partial Class _Default
    Inherits System.Web.UI.Page
    Dim MyDBAction As New DataManagement
    Dim MyDatable As New Data.DataTable
    Dim MyQuery As String = ""
    Dim SqlAction As String = ""
    Dim audit As New DataManagement
    Dim depart As String = ""
    Dim AB As Integer
    Dim MyDatatable As DataTable : Dim Str As String

    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load
        If Not IsPostBack Then
            HiddenField1.Value = 0

            'dtallocdate.Enabled = False

            dtallocdate.DbSelectedDate = Date.Now()
            Str = "SELECT DEPARTMENT FROM	employees  WHERE username ='" & Session("username") & "'" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            If MyDatatable.Rows.Count > 0 Then
                depart = MyDatatable.Rows(0).Item("DEPARTMENT").ToString()

                'empcode = "0238"
            Else
                lblerr.Text = "You are not authorized to view this page"
                Exit Sub
            End If


            Str = "SELECT employeename,username FROM employees WHERE  Activated=1 and department ='" & depart & "' order by  employeename" '"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbosearch
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("employeename").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
            With cboallocateto
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("employeename").ToString
                .DataValueField = MyDatatable.Columns("username").ToString
                .DataBind()
            End With
            'loadgrid()
        End If
    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub

    Protected Sub cmdsave_Click(sender As Object, e As System.EventArgs) Handles cmdsave.Click
        Try
            Dim MailSent As Boolean = False
            Dim email_cc As String = ""
            Dim email As String = ""

            Session("email") = ""
            Dim allocated As String = ""
            If cboallocateto.Text = "" Then
                lblerr.Text = "Task Allocate Name Missing!"
                Exit Sub
            End If
            For Each dataItem As GridDataItem In GDSEARCH_2.MasterTableView.Items
                Dim chkSelect As CheckBox = DirectCast(dataItem.FindControl("chkreturn"), CheckBox)
                If chkSelect.Checked Then
                    Dim File_no As String = dataItem.GetDataKeyValue("File_No").ToString()

                    ' MyDBAction.BUSINESS_REALLOCATE(ID, cbosearch.SelectedValue, CDate(dtalloc.DbSelectedDate).ToString("yyyy-MM-dd"), cboallocateto.SelectedValue, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"), "")

                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Mship_Reallocated=1, Allocated_to ='" & Trim(cboallocateto.SelectedValue) & "',Allocate_DT='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "' where [File_No]= '" & File_no & "'")
                    If txtcomment.Text <> "" Then
                        MyDBAction.TRACKING_MESSAGES(File_no, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
                    End If
                    audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Tracking Reallocation", "Reallocated Record :-   :" & File_no & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".",
                      Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)

                End If
            Next
            lblerr.Text = "Task handover saved successfully!"
            loadgrid()
            lblFileno.Text = ""
            HiddenField1.Value = 0

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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Dear : </b>" & cboallocateto.Text & "  </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = "Business Reallocation :" & lblFileno.Text & ""
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'>" & Session("msg") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No    :</b>" & lblFileno.Text & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Date       :</b> " & Date.Now() & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Updated By :</b> " & Session("FullNames") & " </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("----------------------------------------<b>Notes</b>--------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("" & Session("msg") & "")
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
    Protected Sub cmdedit_Click(sender As Object, e As System.EventArgs) Handles cmdedit.Click

        cboallocateto.Enabled = True
        'txtcomment.Enabled = True

    End Sub

    Public Sub loadgrid()
        MyDatable = Nothing
        SqlAction = "SELECT [File_No],[Proposer_Name], File_Status,Business_Type,Client_Type,Allocated_to,Allocate_Dt FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1 AND ALLOCATED=1  AND Filed=0 and Allocated_to='" & cbosearch.SelectedValue & "' and file_status in ('ALLOCATED') order by Allocate_Dt asc"
        MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatable.Rows.Count > 0 Then
            GDSEARCH_2.DataSource = MyDatable
            GDSEARCH_2.DataBind()
            Session("DAD_T2") = MyDatable
            MyDatable = Nothing
        Else
            GDSEARCH_2.DataSource = MyDatable
            GDSEARCH_2.DataBind()
        End If


    End Sub

    Protected Sub GDSEARCH_2_PageIndexChanged(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDSEARCH_2.PageIndexChanged
        GDSEARCH_2.CurrentPageIndex = e.NewPageIndex
        GDSEARCH_2.DataSource = Session("DAD_T2")
        GDSEARCH_2.DataBind()
    End Sub

    Protected Sub ToggleRowSelection(ByVal sender As Object, ByVal e As EventArgs)
        Dim Total As Decimal

        TryCast(TryCast(sender, CheckBox).NamingContainer, GridItem).Selected = TryCast(sender, CheckBox).Checked
        Dim checkHeader As Boolean = True
        For Each dataItem As GridDataItem In GDSEARCH_2.MasterTableView.Items
            If Not TryCast(dataItem.FindControl("chkreturn"), CheckBox).Checked Then
                checkHeader = False

                Exit For
            End If

        Next
        Dim headerItem As GridHeaderItem = TryCast(GDSEARCH_2.MasterTableView.GetItems(GridItemType.Header)(0), GridHeaderItem)
        TryCast(headerItem.FindControl("chkheader"), CheckBox).Checked = checkHeader

    End Sub

    Protected Sub ToggleSelectedState(ByVal sender As Object, ByVal e As EventArgs)
        Dim headerCheckBox As CheckBox = TryCast(sender, CheckBox)

        For Each dataItem As GridDataItem In GDSEARCH_2.MasterTableView.Items
            TryCast(dataItem.FindControl("chkreturn"), CheckBox).Checked = headerCheckBox.Checked
            dataItem.Selected = headerCheckBox.Checked

        Next
    End Sub



    Protected Sub SEARCH_Click(sender As Object, e As System.EventArgs) Handles SEARCH.Click
        Str = ""
        Try
            Dim SqlAction As String = ""
            Dim searchStr As String = ""
            Dim MyDBAction As New DataManagement

            GDSEARCH_2.DataSource = Nothing
            GDSEARCH_2.DataBind()


            SqlAction = "SELECT [File_No],[Proposer_Name], File_Status,Business_Type,Client_Type,Allocated_to,Allocate_Dt FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Forwarded=1 AND Ready_For_Update=1 AND ALLOCATED=1  AND Filed=0 and Allocated_to='" & cbosearch.SelectedValue & "' and file_status in ('ALLOCATED') order by Allocate_Dt asc"
            Dim MyDatable As New Data.DataTable
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

            If MyDatable.Rows.Count > 0 Then
                GDSEARCH_2.DataSource = MyDatable
                GDSEARCH_2.DataBind()
                Session("DAD_T2") = MyDatable
                MyDatable = Nothing
            Else
                GDSEARCH_2.DataSource = MyDatable
                GDSEARCH_2.DataBind()
            End If
        Catch ex As Exception

        End Try
    End Sub



    Protected Sub GDSEARCH_2_NeedDataSource(sender As Object, e As GridNeedDataSourceEventArgs) Handles GDSEARCH_2.NeedDataSource

    End Sub
End Class
