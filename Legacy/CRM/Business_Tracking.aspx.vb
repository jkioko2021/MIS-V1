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
    Dim email As New Mail
    Protected Sub Page_Load(sender As Object, e As System.EventArgs) Handles Me.Load

        If Not IsPostBack Then
            Try
                Dim unit_code As String = ""
                Dim region_code As String = ""
                dtreceivedate.DbSelectedDate = Date.Now
                dtreceivedate.Enabled = False
                dtupload.DbSelectedDate = Date.Now
                HiddenField1.Value = 0
                Session("empcode") = Nothing
                Session("agentemail") = Nothing
                Session("med") = 0
                Session("Allocate") = 0
                Session("INVOICED") = 0
                'ltEmbed.Text = ""
          

                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] WHERE ACTIVE=1 and code not in (5,4,3)"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With chklist
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
                    .DataBind()
                End With

                Str = "SELECT DISTINCT USER_ID,AGENT_NAME FROM COMMISSION.dbo.TBL_MIS_SALES_AGENTS WHERE ACTIVE=1  ORDER BY AGENT_NAME" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cboagent
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("AGENT_NAME").ToString
                    .DataValueField = MyDatatable.Columns("USER_ID").ToString
                    .DataBind()
                End With

                Str = "SELECT DISTINCT EmployeeName,username FROM dbo.Employees WHERE  Activated=1 AND approved=1 AND Deleted=0 AND Department IN ('MEMBERSHIP','NONMEDICAL')" '"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbomship
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("EmployeeName").ToString
                    .DataValueField = MyDatatable.Columns("username").ToString
                    .DataBind()
                End With

                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE entered_by='" & Session("username") & "' and Forwarded=0 AND Is_Active=1"
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
        End If

    End Sub
   
    'Protected Sub cboBusiness_SelectedIndexChanged(sender As Object, e As Telerik.Web.UI.RadComboBoxSelectedIndexChangedEventArgs) Handles cboBusiness.SelectedIndexChanged
    '    Try
    '        'ltEmbed.Text = ""
    '        If cboclient.SelectedValue = "R" Then
    '            chklist.Items.Clear()
    '            If cboBusiness.SelectedValue = "N" Then
    '                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'R' AND CLIENT='R'"
    '                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
    '                With chklist
    '                    .Items.Clear()
    '                    .DataSource = MyDatatable
    '                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
    '                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
    '                    .DataBind()
    '                End With
    '            ElseIf cboBusiness.SelectedValue = "R" Then
    '                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'N' AND CLIENT='R'"
    '                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
    '                With chklist
    '                    .Items.Clear()
    '                    .DataSource = MyDatatable
    '                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
    '                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
    '                    .DataBind()
    '                End With
    '            End If
    '        Else
    '            chklist.Items.Clear()
    '            If cboBusiness.SelectedValue = "N" Then
    '                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'R' AND CLIENT='C'"
    '                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
    '                With chklist
    '                    .Items.Clear()
    '                    .DataSource = MyDatatable
    '                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
    '                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
    '                    .DataBind()
    '                End With
    '            ElseIf cboBusiness.SelectedValue = "R" Then
    '                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where  [BUSINESS_TYPE] <>'N' AND CLIENT='C'"
    '                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
    '                With chklist
    '                    .Items.Clear()
    '                    .DataSource = MyDatatable
    '                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
    '                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
    '                    .DataBind()
    '                End With
    '            End If
    '        End If

    '    Catch ex As Exception
    '        lblerr.Text = ex.Message
    '    End Try
    'End Sub
    Protected Sub GDTracking_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GDTracking.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("File_No").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""
            Dim audit As New DataManagement
            UpdateRecord("UPDATE  [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Is_Active=0  WHERE File_No='" & HiddenField1.Value.ToString & "' AND FILE_STATUS IN ('REGISTERED','FORWARDED','RETURNED-INCOMPLETE')")
            'DeleteRecord("DELETE FROM TBL_MIS_CRM_DOCS WHERE  File_No='" & HiddenField1.Value.ToString & "'")

            audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Tracking Delete", "Deleted Record :-   :" & HiddenField1.Value & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".", _
           Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            HiddenField1.Value = ""
            HiddenField1.Value = ""

            'ResetDisplayed("NewRecord")
            lblerr.Text = "Record Deleted!"
            'CmdSave.Enabled = False

            loadGrid_N()

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
 
    Private Sub DeleteRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Delete)

        'ShowGridDetails()
    End Sub

    Protected Sub btnsave_Click(sender As Object, e As System.EventArgs) Handles btnsave.Click
        Try
            Dim mtiba As Integer = 0
            Dim Is_IPF As Integer = 0
            Dim walkin As String = "N"
            If chkmtiba.Checked = True Then
                mtiba = 1
            End If
            If chkipf.Checked = True Then
                Is_IPF = 1
            End If

            If chkwalkin.Checked = True Then
                walkin = "Y"
            End If
            Dim complete As Integer = 0
            If chkassembly.Checked = True Then
                complete = 1
            End If
            If cboBusiness.SelectedValue = "" Then
                lblsave.Text = "Select The Business Type"
                Exit Sub
            End If
            If cboclient.SelectedValue = "" Then
                lblsave.Text = "Select The Client Type"
                Exit Sub
            End If
            If cboagent.SelectedValue = "" Then
                lblsave.Text = "Select The Agent"
                Exit Sub
            End If
            If txtProposer.Text = "" Then
                lblsave.Text = "Enter the Proposer Name"
                Exit Sub
            End If
        
            If cborateType.SelectedValue = "" Then
                lblsave.Text = "Select The Rate Type.i.e Normal standard or negotiated rates!"
                cborateType.Focus()
                Exit Sub
            End If
            If chkwalkin.Checked = True And cbomship.SelectedValue = "" Then
                lblsave.Text = "Select the membership admin!"
                cbomship.Focus()
                Exit Sub
            End If

            If chkwalkin.Checked = False Then
                cbomship.SelectedValue = ""
            End If
            If cboclient.SelectedValue = "C" Then
                cborateType.SelectedValue = "C"
            End If
            If cboclient.SelectedValue = "R" Then
                cborateType.SelectedValue = "S"
            End If
        
            If HiddenField1.Value = 0 Then
                Generate_Task()
                If txtrefno.Text = "" Then
                    txtrefno.Text = FILE_NO.Text
                End If
                MyDBAction.Business_Tracking(FILE_NO.Text, cboBusiness.SelectedValue, cboclient.SelectedValue, txtProposer.Text, txtFamily.Text, cboagent.SelectedValue, txtpremium.Text, mtiba, CDate(dtreceivedate.DbSelectedDate).ToString("yyyy-MM-dd hh:mm"), complete, HiddenField1.Value, Session("UserName").ToString, cboBUS.SelectedValue, HiddenField1.Value, cbobenefit.SelectedValue, 0, walkin, cbomship.SelectedValue, cborateType.SelectedValue, Is_IPF, Trim(txtrefno.Text).ToUpper, txtreceiptamt.Text)
            Else
                If txtrefno.Text = "" Then
                    txtrefno.Text = FILE_NO.Text
                End If
                MyDBAction.Business_Tracking(FILE_NO.Text, cboBusiness.SelectedValue, cboclient.SelectedValue, txtProposer.Text, txtFamily.Text, cboagent.SelectedValue, txtpremium.Text, mtiba, CDate(dtreceivedate.DbSelectedDate).ToString("yyyy-MM-dd hh:mm"), complete, HiddenField1.Value, Session("UserName").ToString, cboBUS.SelectedValue, HiddenField1.Value, cbobenefit.SelectedValue, 0, walkin, cbomship.SelectedValue, cborateType.SelectedValue, Is_IPF, Trim(txtrefno.Text).ToUpper, txtreceiptamt.Text)
            End If
            For Each MyItem In chklist.Items
                If MyItem.Selected = True Then
                    MyDBAction.UPLOAD_ITEMS(FILE_NO.Text, MyItem.value, MyItem.TEXT, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"))
                End If
            Next
         

            loadGrid_N()
            loadGrid(FILE_NO.Text)

            txtcomment.Text = ""
            HiddenField1.Value = 0
            lblsave.Text = "Saved Successfully!"
            txtProposer.Text = ""
            txtFamily.Text = ""

            dtreceivedate.DbSelectedDate = Date.Now

            cboBusiness.Text = ""
            cboclient.Text = ""
            chkassembly.Checked = False
            txtpremium.Text = 0
            cboBusiness.Text = ""
            cboclient.Text = ""
            txtrefno.Text = ""
            txtreceiptamt.Text = 0
            chkmtiba.Checked = False
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE entered_by='" & Session("username") & "' and Forwarded=0 AND Ready_For_update=0 AND Is_Declined=0  AND Is_Active=1"
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
        Try
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1 ORDER BY DOC_ID ASC"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                GD_DOCS.DataSource = MyDatable
                GD_DOCS.DataBind()
                MyDatable = Nothing
            Else
                GD_DOCS.DataSource = MyDatable
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
        'ltEmbed.Text = ""
        Dim VER As String = "NO"
        Dim To_em As String = ""
        Try
            If chkassembly.Checked = False Then
                lblerr.Text = "You Must Tick Business is complete Checkbox!"
                Exit Sub
            End If
            If FILE_NO.Text = "" Then
                lblerr.Text = "Select the File!"
                Exit Sub
            End If

            If txtcomment.Text = "" Then
                lblerr.Text = "You Must capture basic Comments!"
                Exit Sub
            End If

            SqlAction = "SELECT  File_Name FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE File_No='" & FILE_NO.Text & "' AND ACTIVE=1 AND Upload_Done=0"
            MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatatable.Rows.Count > 0 Then
                btnsave.Enabled = True
                lblerr.Text = "You must upload the Missing Documents!"
                Exit Sub
            Else
                If Session("med") = 1 And Session("Allocate") = 0 Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,[Ready_For_update]=0, File_Status='MEDICAL UW-REVIEW' where [File_No]= '" & FILE_NO.Text & "'")

                ElseIf Session("Allocate") = 1 And Session("Benefit_Verified") = "NO" Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='BENEFIT VERIFICATION' where [File_No]= '" & FILE_NO.Text & "'")
                ElseIf Session("Allocate") = 1 And Session("Benefit_Verified") = "YES" And Session("INVOICED") = 0 Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='ALLOCATED' where [File_No]= '" & FILE_NO.Text & "'")

                ElseIf Session("INVOICED") = 1 Then
                    UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='INVOICED' where [File_No]= '" & FILE_NO.Text & "'")
                Else
                    If chkwalkin.Checked = True Then
                        UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Forward_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "',[Is_Complete]=1,Allocated=1,[Ready_For_update]=1, File_Status='ALLOCATED',Allocated_To='" & cbomship.SelectedValue & "',Benefit_Verified='YES', [Walk_In_Client]='Y',[Allocate_Dt]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm") & "' where [File_No]= '" & FILE_NO.Text & "'")
                    Else
                        UpdateRecord("UPDATE [TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1 ,Forwarded_By='" & Session("username") & "' ,[Ready_For_update]=1, [Forward_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd hh:mm:ss tt") & "',File_Status='FORWARDED' where [File_No]= '" & FILE_NO.Text & "'")
                    End If
                End If


                If txtcomment.Text <> "" Then
                    MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd hh:mm:ss tt"), txtcomment.Text)
                End If

                Session("to") = "Team"
                If chkwalkin.Checked = True And cboBUS.SelectedValue = "M" Then
                    Str = "SELECT EMAIL FROM employees WHERE username='" & cbomship.SelectedValue & "'" '"
                    MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                    If MyDatatable.Rows.Count > 0 Then
                        Session("to") = cbomship.Text
                        Session("email") = MyDatatable.Rows(0).Item("EMAIL").ToString()
                        Session("Header") = "Walk-in Client-" & txtProposer.Text
                        Session("msg") = "Kindly note that you  have been Allocated the below Business for a Walk-In Client by Customer Service Desk for update.TREAT THIS AS AGENT!"
                    End If
                Else
                    If cboBUS.SelectedValue = "M" And Session("med") <> 1 Then

                        'Session("email") = "computer-]@aar.co.ke"
                        'Session("Header") = "Registered-" & txtProposer.Text
                        'Session("msg") = "Kindly note that the above client has been Tracked and forwarded to Membership for update!"
                    ElseIf cboBUS.SelectedValue = "N" Then
                        UpdateRecord("UPDATE CRM.[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] SET Forwarded=1,[Is_Complete]=1 ,Allocated=1,Forwarded_By='" & Session("username") & "' ,[Ready_For_update]=1, [Forward_Date]='" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',File_Status='FORWARDED' where [File_No]= '" & FILE_NO.Text & "'")

                        Session("email") = "nonmedical@aar.co.ke"
                        Session("Header") = "Registered-" & txtProposer.Text
                        Session("msg") = "Kindly note that the above client has been Tracked and forwarded to Non-Medical Team for update!"
                        MailSent = SendLoginDetails("Team", Session("email"), Session("email"))
                    End If
                End If

                ' ' 'Session("email") = "jmwaniki@aar.co.ke"
                'Session("cc_email") = ""

                'MailSent = email.SendLoginDetails("Team", Session("email"), Session("email"), Session("msg"), FILE_NO.Text, Session("Fullname"), "")

                lblerr.Text = "Forwarded successfully!"
                loadGrid_N()
                txtcomment.Text = ""
                Session("INVOICED") = 0
                Session("Allocate") = 0
                Session("med") = 0
                chkwalkin.Checked = False
                cbomship.SelectedValue = ""
                GD_DOCS.DataSource = Nothing
                GD_DOCS.DataBind()
                GDNOTES.DataSource = Nothing
                GDNOTES.DataBind()
            End If
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub
    Protected Sub btnupload_Click(sender As Object, e As System.EventArgs) Handles btnupload.Click
        Dim MyDatable As New Data.DataTable
        Dim STS As Integer
        Dim aar As Integer = 0
        Dim PROPOSER_ID As String
        Dim PERIOD As String
        Dim FILENO As String
        'ltEmbed.Text = ""
        Try

            If FL1.PostedFile.FileName = "" Then
                lblerr.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If
            If txttitle.Text = "" Then
                lblerr.Text = "You must enter Document title!"
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
                Case ".eml"
                    contenttype = "application/zip"
                    Exit Select
                Case ".msg"
                    contenttype = "application/zip"
                    Exit Select
            End Select

            If contenttype <> String.Empty Then
                Dim fileLocation As String = ""
                MyDBAction.UPLOAD_File_DOCS(bytes, filename, contenttype, FILE_NO.Text, Trim(txttitle.Text.ToUpper), CDate(dtupload.DbSelectedDate).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), DOC_ID.Text)
                'Response.Redirect(Request.Url.AbsoluteUri)
                lblupload.ForeColor = System.Drawing.Color.Green

                lblupload.Text = "File Uploaded Successfully"

            Else
                lblupload.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If
            loadGrid(FILE_NO.Text)

            DOC_ID.Text = ""
            'lbltaskno.Text = ""
            txttitle.Text = ""
            dtupload.DbSelectedDate = Date.Now

        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try

    End Sub
    'Protected Sub DownloadFile(sender As Object, e As EventArgs)
    '    ltEmbed.Text = ""
    '    Dim id As Integer = Integer.Parse(TryCast(sender, LinkButton).CommandArgument)
    '    Dim embed As String = "<object data=""{0}{1}"" type=""application/pdf"" width=""1000px"" height=""600px"">"
    '    embed += "If you are unable to view file, you can download from <a href = ""{0}{1}&download=1"">here</a>"
    '    embed += " or download <a target = ""_blank"" href = ""{0}{1}&download=1"">Adobe PDF Reader</a> to view the file."
    '    embed += "</object>"
    '    ltEmbed.Text = String.Format(embed, ResolveUrl("~/FileDoc.ashx?Id="), id)
    'End Sub


    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            'ltEmbed.Text = ""
            GD_Pay.DataSource = Nothing
            GD_Pay.DataBind()
            Dim W As String = ""
            lblerr.Text = ""
            HiddenField1.Value = 1
            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Business,Pay_Ref_No,Paid_Amt, Receive_dt,Client_Type,Is_Mtiba,Is_Complete,Agent_id,Medical_UW,Allocated,INVOICED,Walk_In_Client,Allocated_to,Rate_Type,Is_IPF,Benefit_Verified   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                txtProposer.Text = MyDatable.Rows(0).Item("Proposer_Name").ToString()
                txtFamily.Text = MyDatable.Rows(0).Item("Family_code").ToString()
                dtreceivedate.DbSelectedDate = MyDatable.Rows(0).Item("Receive_dt").ToString()
                txtpremium.Text = MyDatable.Rows(0).Item("Premium").ToString()
                cboBusiness.SelectedValue = MyDatable.Rows(0).Item("Business_Type").ToString()
                cboclient.SelectedValue = MyDatable.Rows(0).Item("Client_Type").ToString()
                'chkmtiba.Checked = MyDatable.Rows(0).Item("Is_Mtiba").ToString()
                chkassembly.Checked = MyDatable.Rows(0).Item("Is_Complete").ToString()
                cboagent.SelectedValue = MyDatable.Rows(0).Item("Agent_id").ToString()
                cboBUS.SelectedValue = MyDatable.Rows(0).Item("Business").ToString()
                W = MyDatable.Rows(0).Item("Walk_In_Client").ToString()
                cbomship.SelectedValue = MyDatable.Rows(0).Item("Allocated_to").ToString()
                Session("med") = MyDatable.Rows(0).Item("Medical_UW").ToString()
                Session("Allocate") = MyDatable.Rows(0).Item("Allocated").ToString()
                Session("INVOICED") = MyDatable.Rows(0).Item("INVOICED").ToString()
                cborateType.SelectedValue = MyDatable.Rows(0).Item("Rate_Type").ToString()
                Session("Benefit_Verified") = MyDatable.Rows(0).Item("Benefit_Verified").ToString()
                txtrefno.Text = MyDatable.Rows(0).Item("Pay_Ref_No").ToString()
                txtreceiptamt.Text = MyDatable.Rows(0).Item("Paid_Amt").ToString()
                '
                chkipf.Checked = MyDatable.Rows(0).Item("Is_IPF").ToString()
                loadGrid(FILE_NO.Text)
                If W = "Y" Then
                    chkmtiba.Checked = True
                Else
                    chkmtiba.Checked = False
                End If


                SqlAction = "SELECT Doc_code FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & FILE_NO.Text & "' and Active=1"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
                chklist.ClearSelection()
                For Each dt2_row As System.Data.DataRow In MyDatable.Rows
                    Dim IT As String = dt2_row("Doc_code").ToString()
                    For i As Integer = 0 To chklist.Items.Count - 1
                        If chklist.Items(i).Value = IT Then
                            chklist.Items(i).Selected = True
                        End If
                    Next

                Next
            End If
            cbomship.Enabled = False
            chkwalkin.Enabled = False
            chklist.Enabled = False
            btnsave.Enabled = False
            txtProposer.Enabled = False
            txtFamily.Enabled = False
            dtreceivedate.Enabled = False
            txtpremium.Enabled = False
            cboBusiness.Enabled = False
            cboclient.Enabled = False
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub
    Public Sub Generate_Task()
        SqlAction = "SELECT ISNULL((MAX(Id)+1),1) NUMBER FROM [dbo].[TBL_MIS_CRM_BUSINESS_TRACKING]"
        MyDatatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
        If MyDatatable.Rows.Count > 0 Then
            AB = MyDatatable.Rows(0).Item("NUMBER").ToString()
            Dim numStr4ch As String = Strings.Right("000" & AB.ToString(), 4)
            FILE_NO.Text = cboclient.SelectedValue & "-" & Month(Date.Now()) & "/" & Right(Year(Date.Now()), 2) & "/-" + numStr4ch + ""
            txtrefno.Text = "REF" & "-" & Month(Date.Now()) & "/" & Right(Year(Date.Now()), 2) & "/-" + numStr4ch + ""
        End If
    End Sub
    
    Protected Sub btnedit_Click(sender As Object, e As System.EventArgs) Handles btnedit.Click
        HiddenField1.Value = 1
        chklist.Enabled = True
        txtProposer.Enabled = True
        txtFamily.Enabled = True
        dtreceivedate.Enabled = True
        txtpremium.Enabled = True
        cboBusiness.Enabled = True
        cboclient.Enabled = True
        btnsave.Enabled = True
        cbomship.Enabled = True
        chkwalkin.Enabled = True
    End Sub

    Protected Sub GD_DOCS_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_DOCS.SelectedIndexChanged
        Try
            Dim stst As String = ""
            HiddenField1.Value = ""
            'ltEmbed.Text = ""
            stst = (DirectCast(GD_DOCS.SelectedItems(0), GridDataItem)).GetDataKeyValue("DOC_ID").ToString()
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM  [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  DOC_ID ='" & stst & "' AND ACTIVE=1"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                txttitle.Text = MyDatable.Rows(0).Item("Doc_Title").ToString()
                DOC_ID.Text = MyDatable.Rows(0).Item("DOC_ID").ToString()
            End If
            'ltEmbed.Text = ""
        Catch ex As Exception
            lblerr.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Is_Declined=0 AND Ready_For_update=0  AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Is_Declined=0 AND Ready_For_update=0  AND Is_Active=1"
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

    Protected Sub btnnew_Click(sender As Object, e As System.EventArgs) Handles btnnew.Click
        HiddenField1.Value = 0
        txtProposer.Enabled = True
        chklist.Enabled = True
        txtFamily.Enabled = True
        dtreceivedate.Enabled = True
        txtpremium.Enabled = True
        cboBusiness.Enabled = True
        cboclient.Enabled = True
        btnsave.Enabled = True
        cbomship.Enabled = True
        chkwalkin.Enabled = True
        cbomship.SelectedValue = ""
        chkwalkin.Checked = False
        FILE_NO.Text = ""
        txtProposer.Text = ""
        txtFamily.Text = ""
        dtreceivedate.DbSelectedDate = Date.Now
        txtpremium.Text = ""
        cboBusiness.Text = ""
        cboclient.Text = ""
        chkassembly.Checked = False
        chkmtiba.Checked = False

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
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b><u>Dear, " & Session("to") & " </u></b> </span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            MessageSubject = Session("Header")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>" & Session("msg") & " </b></span>")

            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("--------------------------------------<b>Details</b>------------------------------------------------------")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>File No:" & FILE_NO.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
            strHTML = strHTML.Append("<span style='font-size: 11pt; font-family: Calibri'><b>Client Name: " & txtProposer.Text & " </b></span>")
            strHTML = strHTML.Append("<br />")
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
            MailSent = mymail.SendNotification("", MessageSubject, strHTML.ToString, True, EmailServer, EmailUserName, EmailPassword, RecepientEmail, EmployeeName, LoginFromEmail, LoginDisplayName, ccemail)
            Session("MailSent") = MailSent
        Catch ex As Exception
            'MyDBAction.DoLogs("Class==AssignAdminAccessProfile.vb: Private Sub DisplayMenuItems()" & " : Error : " & ex.Message)
            MailSent = False
        End Try

        Return MailSent
    End Function


  
    Protected Sub txtpaid_TextChanged(sender As Object, e As System.EventArgs) Handles txtpaid.TextChanged

    End Sub

    Protected Sub GDTracking_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDTracking.NeedDataSource

    End Sub

    Protected Sub GDTracking_PageIndexChanged(sender As Object, e As Telerik.Web.UI.GridPageChangedEventArgs) Handles GDTracking.PageIndexChanged

    End Sub
End Class
