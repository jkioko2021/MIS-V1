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


                Str = "SELECT  [DOC_ID],[DOC_NAME] FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_REQ] WHERE ACTIVE=1 and code not in (5)"
                MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
                With chklist
                    .Items.Clear()
                    .DataSource = MyDatatable
                    .DataTextField = MyDatatable.Columns("DOC_NAME").ToString
                    .DataValueField = MyDatatable.Columns("DOC_ID").ToString
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
                lblsave.Text = ex.Message
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
            lblsave.Text = "Record Deleted!"
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
    Protected Sub btnsave_Click(sender As Object, e As System.EventArgs) Handles btnsave.Click
        Try
            Dim mtiba As Integer = 0
            Dim Is_IPF As Integer = 0
            Dim walkin As String = "N"
         
            Dim complete As Integer = 0
          
            For Each MyItem In chklist.Items
                If MyItem.Selected = True Then
                    MyDBAction.UPLOAD_ITEMS(FILE_NO.Text, MyItem.value, MyItem.TEXT, CDate(Date.Now).ToString("yyyy-MM-dd"), Session("username"))
                End If
            Next
            If txtcomment.Text <> "" Then
                MyDBAction.TRACKING_MESSAGES(FILE_NO.Text, Session("username"), CDate(Date.Now).ToString("yyyy-MM-dd"), txtcomment.Text)
            End If

            'loadGrid_N()
            loadGrid(FILE_NO.Text)

            txtcomment.Text = ""
        
        Catch ex As Exception
            lblsave.Text = ex.Message
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
            If txttitle.Text = "" Then
                lblupload.Text = "You must enter Document title!"
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

                Dim audit As New DataManagement
                audit.AddAdminAuditTrail(Session("UserName").ToString, "Added/modified document", "File No:" & FILE_NO.Text & ".", _
                Request.Url.ToString, Session("ip").ToString, Session("sessionid").ToString)

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
                chklist.ClearSelection()
                loadGrid(FILE_NO.Text)
                For Each dt2_row As System.Data.DataRow In MyDatable.Rows
                    Dim IT As String = dt2_row("Doc_code").ToString()
                    For i As Integer = 0 To chklist.Items.Count - 1
                        If chklist.Items(i).Value = IT Then
                            chklist.Items(i).Selected = True
                        End If
                    Next

                Next
            End If
          
            chklist.Enabled = False
            btnsave.Enabled = False
         
        Catch ex As Exception
            lblsave.Text = ex.Message
        End Try
    End Sub

    Protected Sub GD_DOCS_SelectedIndexChanged(sender As Object, e As System.EventArgs) Handles GD_DOCS.SelectedIndexChanged
        Try
            Dim stst As String = ""

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
            lblsave.Text = ex.Message
        End Try
    End Sub

    Protected Sub btnsearch_Click(sender As Object, e As System.EventArgs) Handles btnsearch.Click
        Try
            If cbosearch.SelectedValue = "F" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE File_No Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Is_Active=1"
            ElseIf cbosearch.SelectedValue = "P" Then
                SqlAction = "SELECT [File_No],[Proposer_Name],[Receive_dt],Premium,File_Status,Business_Type  FROM [CRM].[dbo].[TBL_MIS_CRM_BUSINESS_TRACKING] WITH (NOLOCK) WHERE Proposer_Name Like '%" & Trim(txtsearch.Text.ToUpper) & "%' AND Is_Active=1"
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
            lblsave.Text = ex.Message
        End Try
    End Sub

    Protected Sub GDTracking_NeedDataSource(sender As Object, e As Telerik.Web.UI.GridNeedDataSourceEventArgs) Handles GDTracking.NeedDataSource

    End Sub

    Protected Sub btnedit_Click(sender As Object, e As System.EventArgs) Handles btnedit.Click

        chklist.Enabled = True
        btnsave.Enabled = True
    
    End Sub
End Class
