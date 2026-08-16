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

                dtupload.DbSelectedDate = Date.Now
                'ltEmbed.Text = ""
                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] where DOC_ID in ('RET37') order by DOC_ID asc"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With cbodoc
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
                    .DataBind()
                End With

              
                loadGrid_N()

            Catch ex As Exception
                lblupload.Text = ex.Message
            End Try
        End If

    End Sub
    Protected Sub GD_DOCS_DeleteCommand(ByVal sender As Object, ByVal e As Telerik.Web.UI.GridCommandEventArgs) Handles GD_DOCS.DeleteCommand


        Try

            Dim item As GridDataItem = DirectCast(e.Item, GridDataItem)
            HiddenField1.Value = item.OwnerTableView.DataKeyValues(item.ItemIndex)("DOC_ID").ToString()

            Dim MySqlAction As String = ""
            Dim MyDBAction As New DataManagement
            Dim MyDataTable As New Data.DataTable
            Dim File_No As String = ""
            Dim Proposer_Name As String = ""



            'DELETE FROM [TBL_MIS_CRM_DOCS] WHERE File_No=@File_No AND DOC_CODE=@DOC_ID
            UpdateRecord("UPDATE [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] SET Active=0  WHERE DOC_ID='" & HiddenField1.Value.ToString & "'")

            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Business Doc Delete", "Deleted Record :-   :" & File_No & " date:" & Date.Now() & ", Name - " & Session("FullNames") & ".", _
           Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)
            HiddenField1.Value = ""

            'ResetDisplayed("NewRecord")
            lblupload.Text = "Record Deleted!"
            'CmdSave.Enabled = False

            loadGrid_N()
            loadGrid(HiddenField1.Value.ToString)

        Catch ex As Exception


            Dim ErrMsg As String = ex.Message
        End Try
    End Sub
    Private Sub UpdateRecord(ByVal sqlAction As String)
        Dim MySmsObject As New DataManagement
        MySmsObject.DBAction(sqlAction, DataManagement.DBActionType.Update)

    End Sub

    Public Sub loadGrid_N()
        SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type,Client_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE entered_by='" & Session("username") & "' and Forwarded=0 AND Is_Active=1 and Is_Declined=1 and Refund_req=0"
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
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            MyDatable = Nothing
            SqlAction = "SELECT [DOC_ID],[File_No],[Doc_Title],[Doc_Date],[File_Name],[Upload_By] FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & STR & "' AND ACTIVE=1 ORDER BY DOC_ID ASC"
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

        End Try
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
                lblupload.Text = "You must upload a reference pdf file!"
                Exit Sub
            End If
            If cbodoc.SelectedValue = "" Then
                lblupload.Text = "You must enter Document!"
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
                    Exit Select
            End Select

            If contenttype <> String.Empty Then
                Dim fileLocation As String = ""
                MyDBAction.UPLOAD_File_DOC_INVOIC(bytes, filename, contenttype, FILE_NO.Text, Trim(cbodoc.Text.ToUpper), CDate(Date.Now()).ToString("yyyy-MM-dd"), Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), cbodoc.SelectedValue, "NA")
              
                lblupload.ForeColor = System.Drawing.Color.Green

                lblupload.Text = "File Uploaded Successfully"

            Else
                lblupload.Text = "File format not recognised." _
            & " Upload Image/Word/PDF/Excel formats"
            End If

            loadGrid(FILE_NO.Text)


            DOC_ID.Text = ""
            'lbltaskno.Text = ""

            dtupload.DbSelectedDate = Date.Now

        Catch ex As Exception
            lblupload.Text = ex.Message
        End Try

    End Sub

    Protected Sub GDTracking_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GDTracking.SelectedIndexChanged
        Try
            'ltEmbed.Text = ""

            Dim W As String = ""
            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()

            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()

            ID = (DirectCast(GDTracking.SelectedItems(0), GridDataItem)).GetDataKeyValue("File_No").ToString()
            SqlAction = "SELECT [File_No],[Proposer_Name],[Family_code],Premium,File_Status,Business_Type,Business,Pay_Ref_No,Paid_Amt, Receive_dt,Client_Type,Is_Mtiba,Is_Complete,Agent_id,Medical_UW,Allocated,INVOICED,Walk_In_Client,Allocated_to,Rate_Type,Is_IPF,Benefit_Verified   FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No='" & ID & "'"
            MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)
            If MyDatable.Rows.Count > 0 Then
                FILE_NO.Text = MyDatable.Rows(0).Item("File_No").ToString()
                W = MyDatable.Rows(0).Item("Walk_In_Client").ToString()
                Session("med") = MyDatable.Rows(0).Item("Medical_UW").ToString()
                Session("Allocate") = MyDatable.Rows(0).Item("Allocated").ToString()
                Session("INVOICED") = MyDatable.Rows(0).Item("INVOICED").ToString()
                Session("Benefit_Verified") = MyDatable.Rows(0).Item("Benefit_Verified").ToString()
                SqlAction = "SELECT Doc_code FROM [Doc_Arc_DB].[dbo].[TBL_MIS_CRM_DOCS] WHERE  File_No ='" & FILE_NO.Text & "' and Active=1"
                MyDatable = TryCast(MyDBAction.DBAction(SqlAction, DataManagement.DBActionType.DataTable), Data.DataTable)

                loadGrid(FILE_NO.Text)
             
            End If

        Catch ex As Exception
            lblupload.Text = ex.Message
        End Try
    End Sub

    

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Is_Active=1 and Is_Declined=1 and Refund_req=0"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Is_Active=1 and Is_Declined=1 and Refund_req=0"
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
            lblupload.Text = ex.Message
        End Try
    End Sub

   
    Protected Sub btnsubmit_Click(sender As Object, e As System.EventArgs) Handles btnsubmit.Click
        Try
            UpdateRecord("UPDATE CRM.dbo.[TBL_MIS_CRM_BUSINESS_TRACKING] SET File_Status='REFUND-REQUESTED', Ready_For_update=1,Refund_req=1,[Refund_Req_Dt]= '" & CDate(Date.Now).ToString("yyyy-MM-dd") & "',Refund_Req_By='" & Session("username") & "' where [File_No]= '" & FILE_NO.Text & "'")

            If txtcomment.Text <> "" Then
                'MyDBAction.Save_Refund(refNo.text,tx   FILE_NO.Text, txt Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd hh:mm"), txtcomment.Text)
            End If

            lblupload.Text = "Forward Successful!"
            loadGrid_N()

            GD_DOCS.DataSource = Nothing
            GD_DOCS.DataBind()
            GDNOTES.DataSource = Nothing
            GDNOTES.DataBind()

            Dim audit As New DataManagement
            audit.AddAdminAuditTrail(Session("UserName").ToString, "Request Refund", "File No:" & FILE_NO.Text & ".", _
            Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)

        Catch ex As Exception
            lblupload.Text = ex.Message
        End Try
    End Sub
End Class
