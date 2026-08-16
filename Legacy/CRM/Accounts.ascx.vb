Imports System
Imports System.Data
Imports System.Collections
Imports System.Web.UI
Imports Telerik.Web.UI
Imports System.Data.SqlClient
Imports DocManage

Partial Class Accounts
    Inherits System.Web.UI.UserControl
    Dim MyDBAction As New DataManagement
    Dim mode As Integer
    Private _dataItem As Object = Nothing

    Public Property DataItem() As Object
        Get
            Return Me._dataItem
        End Get
        Set(ByVal value As Object)
            Me._dataItem = value
        End Set
    End Property

#Region "Web Form Designer generated code"
    Private Sub LoadCombos()
        Try
            Dim MyDatatable As DataTable : Dim Str As String

            '------------------------------------ Currency-------------------------------------
            Str = "SELECT CCYCODE,CCYNAME FROM Currencies"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With LstAccCurrency
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("CCYNAME").ToString
                .DataValueField = MyDatatable.Columns("CCYCODE").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing

            '------------------------------------ Account Indicator-------------------------------------
            Str = "SELECT Code,Indicator FROM AccountIndicator"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboaccindicator
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("Indicator").ToString
                .DataValueField = MyDatatable.Columns("Code").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
            '------------------------------------ Account Holder Type-------------------------------------
            Str = "SELECT CRBCode,CRBDesc FROM AccountHolderType"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboaccholdertype
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("CRBDesc").ToString
                .DataValueField = MyDatatable.Columns("CRBCode").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
            '------------------------------------ Account Product Type-------------------------------------
            Str = "SELECT distinct CRBCode,CRBDesc FROM AccountProductType"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboaccprodtype
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("CRBDesc").ToString
                .DataValueField = MyDatatable.Columns("CRBCode").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
            '------------------------------------ Security Type-------------------------------------
            Str = "SELECT Code,Type FROM SecurityType"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbosectype
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("Type").ToString
                .DataValueField = MyDatatable.Columns("Code").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
            ''------------------------------------ Industry Code-------------------------------------
            'Str = "SELECT Code,Type FROM EmployerIndustryType"
            'MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            'With txtindcode
            '    .Items.Clear()
            '    .DataSource = MyDatatable
            '    .DataTextField = MyDatatable.Columns("Type").ToString
            '    .DataValueField = MyDatatable.Columns("Code").ToString
            '    .DataBind()

            '    Dim MyItem As New RadComboBoxItem
            '    MyItem.Text = ""
            '    MyItem.Value = ""
            '    .Items.Add(MyItem)
            '    .SelectedValue = MyItem.Value
            'End With
            'MyDatatable = Nothing
            '------------------------------------ Account Status-------------------------------------
            Str = "SELECT StatusCode,StatusName FROM AccountStatus"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cboaccstatus
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("StatusName").ToString
                .DataValueField = MyDatatable.Columns("StatusCode").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
            '------------------------------------ Payment Frequency-------------------------------------
            Str = "SELECT Code,Frequency FROM PaymentFrequency"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbopayfrequ
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("Frequency").ToString
                .DataValueField = MyDatatable.Columns("Code").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
            '------------------------------------ NPL Indicator-------------------------------------
            Str = "SELECT Code,Indicator FROM NPLIndicator"
            MyDatatable = TryCast(MyDBAction.DBAction(Str, DataManagement.DBActionType.DataTable), DataTable)
            With cbonplindicator
                .Items.Clear()
                .DataSource = MyDatatable
                .DataTextField = MyDatatable.Columns("Indicator").ToString
                .DataValueField = MyDatatable.Columns("Code").ToString
                .DataBind()

                Dim MyItem As New RadComboBoxItem
                MyItem.Text = ""
                MyItem.Value = ""
                .Items.Add(MyItem)
                .SelectedValue = MyItem.Value
            End With
            MyDatatable = Nothing
        Catch ex As Exception

        End Try
    End Sub

    Protected Sub IndividualInfo_DataBinding(ByVal sender As Object, ByVal e As System.EventArgs)
        Try
            LoadCombos()
            Dim tocValue1 As String = DataBinder.Eval(DataItem, "ACC_JOINT_SINGLE").ToString
            Dim tocValue2 As String = DataBinder.Eval(DataItem, "ACC_HOLDER_TYPE").ToString
            Dim tocValue3 As String = DataBinder.Eval(DataItem, "ACC_PROD_TYPE").ToString
            Dim tocValue5 As String = DataBinder.Eval(DataItem, "NPL_INDICATOR").ToString
            Dim tocValue6 As String = DataBinder.Eval(DataItem, "ACC_STATUS").ToString
            Dim tocValue7 As String = DataBinder.Eval(DataItem, "PAYMENT_FREQ").ToString
            Dim tocValue8 As String = DataBinder.Eval(DataItem, "SEC_TYPE").ToString
            Dim tocValue9 As String = DataBinder.Eval(DataItem, "ACC_CLOSURE_REASON").ToString
            Dim tocValue10 As String = DataBinder.Eval(DataItem, "CURRENCY").ToString

            '---------------ACC_CLOSURE_REASON -----------
            Dim MyValue As String = ""
            MyValue = tocValue9.ToString

            Dim Li As RadComboBoxItem
            Li = cboaccclosurereason.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cboaccclosurereason.SelectedIndex = Li.Index
            Else
                cboaccclosurereason.SelectedValue = ""
            End If

            cboaccclosurereason.DataSource = Nothing

            '---------------CURRENCY -----------
            MyValue = tocValue10.ToString

            Li = LstAccCurrency.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                LstAccCurrency.SelectedIndex = Li.Index
            Else
                LstAccCurrency.SelectedValue = ""
            End If

            LstAccCurrency.DataSource = Nothing

            '---------------ACC_HOLDER_TYPE -----------
            MyValue = tocValue2.ToString

            Li = cboaccholdertype.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cboaccholdertype.SelectedIndex = Li.Index
            Else
                cboaccholdertype.SelectedValue = ""
            End If

            cboaccholdertype.DataSource = Nothing

            '---------------ACC_PROD_TYPE -----------
            MyValue = tocValue3.ToString

            Li = cboaccprodtype.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cboaccprodtype.SelectedIndex = Li.Index
            Else
                cboaccprodtype.SelectedValue = ""
            End If

            cboaccprodtype.DataSource = Nothing

            '---------------NPL_INDICATOR -----------
            MyValue = tocValue5.ToString

            Li = cbonplindicator.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cbonplindicator.SelectedIndex = Li.Index
            Else
                cbonplindicator.SelectedValue = ""
            End If

            cbonplindicator.DataSource = Nothing

            '---------------ACC_STATUS -----------
            MyValue = tocValue6.ToString

            Li = cboaccstatus.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cboaccstatus.SelectedIndex = Li.Index
            Else
                cboaccstatus.SelectedValue = ""
            End If

            cboaccstatus.DataSource = Nothing

            '---------------PAYMENT_FREQ -----------
            MyValue = tocValue7.ToString

            Li = cbopayfrequ.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cbopayfrequ.SelectedIndex = Li.Index
            Else
                cbopayfrequ.SelectedValue = ""
            End If

            cbopayfrequ.DataSource = Nothing

            '---------------SEC_TYPE -----------
            MyValue = tocValue8.ToString

            Li = cbosectype.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cbosectype.SelectedIndex = Li.Index
            Else
                cbosectype.SelectedValue = ""
            End If

            cbosectype.DataSource = Nothing

            '---------------INDUSTRY_CODE -----------
            'MyValue = tocValue4.ToString

            'Li = txtindcode.FindItemByValue(MyValue)
            'If Li IsNot Nothing Then
            '    txtindcode.SelectedIndex = Li.Index
            'Else
            '    txtindcode.SelectedIndex = -1
            'End If

            'txtindcode.DataSource = Nothing

            '---------------ACC_JOINT_SINGLE -----------
            MyValue = tocValue1.ToString

            Li = cboaccindicator.FindItemByValue(MyValue)
            If Li IsNot Nothing Then
                cboaccindicator.SelectedIndex = Li.Index
            Else
                cboaccindicator.SelectedValue = ""
            End If

            cboaccindicator.DataSource = Nothing
        Catch ex As Exception

        End Try

    End Sub

    Protected Overrides Sub OnInit(ByVal e As EventArgs)
        '
        ' CODEGEN: This call is required by the ASP.NET Web Form Designer.
        '
        InitializeComponent()
        MyBase.OnInit(e)
    End Sub

    Private Sub InitializeComponent()
        AddHandler DataBinding, AddressOf Me.IndividualInfo_DataBinding
    End Sub

#End Region


End Class
