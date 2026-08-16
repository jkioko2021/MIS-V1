<%@ Page Title="" Language="VB" MasterPageFile="~/MasterPage.master" AutoEventWireup="false" CodeFile="Business_tracking_Reall_mship.aspx.vb" Inherits="_Default" %>

<%@ OutputCache Location="None" %>
<%@ Register Assembly="AjaxControlToolkit" Namespace="AjaxControlToolkit" TagPrefix="cc1" %>
<%@ Register assembly="Telerik.Web.UI" namespace="Telerik.Web.UI" tagprefix="telerik" %>
<asp:Content ID="Content1" ContentPlaceHolderID="ContentPlaceHolder1" Runat="Server">
    <asp:UpdateProgress ID="UpdateProgress1" runat="server">
        <ProgressTemplate>
         <asp:Label ID="lblProgress" runat="server" Font-Bold="True" ForeColor="#153E7E" Text="Please Wait...."></asp:Label>
        </ProgressTemplate>
    </asp:UpdateProgress>
    <asp:UpdatePanel ID="UpdatePanel1" runat="server">
                <ContentTemplate>
                 <table style="width: 100%">
                                <tr>
                                    <td align="center">
                                        <asp:Panel ID="Panel14" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                            Width="1162px">
                                            <table style="width: 67%">
                                                <tr>
                                                    <td class="style8" colspan="4">
                                                        <asp:Panel ID="Panel8" runat="server" BorderStyle="Solid" BorderWidth="1px" 
                                                            Height="100%" Width="1151px">
                                                            <table style="width: 100%">
                                                                <tr>
                                                                    <td align="center" bgcolor="#999999" colspan="5">
                                                                        <asp:Label ID="Label132" runat="server" Font-Bold="True" 
                                                                            Text="Handover Task/Issue"></asp:Label>
                                                                    </td>
                                                                </tr>
                                                                <tr>
                                                                    <td style="width: 2817px">
                                                                        <asp:Label ID="Label73" runat="server" style="font-weight: 700" 
                                                                            Text="Search By"></asp:Label>
                                                                    </td>
                                                                    <td style="width: 445px">
                                                                        <telerik:RadComboBox ID="cbosearch" Runat="server" Skin="Web20" 
                                                                            style="margin-left: 0px" Width="231px">
                                                                            <Items>
                                                                                <telerik:RadComboBoxItem runat="server" Text="Task Name" Value="N" />
                                                                                <telerik:RadComboBoxItem runat="server" Text="Task Code" Value="C" />
                                                                            </Items>
                                                                        </telerik:RadComboBox>
                                                                    </td>
                                                                    <td>
                                                                        &nbsp;</td>
                                                                    <td>
                                                                        &nbsp;</td>
                                                                    <td>
                                                                        <telerik:RadButton ID="SEARCH" runat="server" Skin="Web20" Text="Search">
                                                                        </telerik:RadButton>
                                                                    </td>
                                                                </tr>
                                                            </table>
                                                        </asp:Panel>
                                                        <table style="width: 100%">
                                                            <tr>
                                                                <td>
                                                                    <asp:Panel ID="Panel12" runat="server" Height="100%" ScrollBars="Both" 
                                                                        Width="100%">
                                                                        <telerik:RadGrid ID="GDSEARCH_2" runat="server" AllowPaging="True" 
                                                                            CellSpacing="0" GridLines="None" Height="100%" Skin="Web20" Width="100%" 
                                                                            PageSize="50">
                                                                            <MasterTableView AutoGenerateColumns="False" DataKeyNames="File_No">
                                                                                <CommandItemSettings ExportToPdfText="Export to PDF" />
                                                                                <RowIndicatorColumn FilterControlAltText="Filter RowIndicator column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </RowIndicatorColumn>
                                                                                <ExpandCollapseColumn FilterControlAltText="Filter ExpandColumn column">
                                                                                    <HeaderStyle Width="20px" />
                                                                                </ExpandCollapseColumn>
                                                                                <Columns>
                                                                                         <telerik:GridTemplateColumn DataType="System.Boolean" UniqueName="Updated">
                                        <ItemTemplate>
                                            <asp:CheckBox ID="chkreturn" runat="server" AutoPostBack="True" 
                                                OnCheckedChanged="ToggleRowSelection" />
                                        </ItemTemplate>
                                        <HeaderTemplate>
                                            <asp:CheckBox ID="chkheader" runat="server" AutoPostBack="True" 
                                                OnCheckedChanged="ToggleSelectedState" />
                                        </HeaderTemplate>
                                    </telerik:GridTemplateColumn>
                                                                                    <telerik:GridBoundColumn DataField="File_No" 
                                                                                        FilterControlAltText="Filter File_No column" HeaderText="File_No" 
                                                                                        SortExpression="File_No" UniqueName="File_No">
                                                                                    </telerik:GridBoundColumn>
                                                                                             <telerik:GridBoundColumn DataField="Business_Type" 
                                                                                        FilterControlAltText="Filter Business_Type column" HeaderText="Business_Type" 
                                                                                        SortExpression="Business_Type" UniqueName="Business_Type">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="Proposer_Name" 
                                                                                        FilterControlAltText="Filter Proposer_Name column" HeaderText="Proposer_Name" 
                                                                                        SortExpression="Proposer_Name" UniqueName="Proposer_Name">
                                                                                        <HeaderStyle Width="200px" />
                                                                                        <ItemStyle Width="200px" />
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="Client_Type" 
                                                                                        FilterControlAltText="Filter Client_Type column" HeaderText="Client_Type" 
                                                                                        SortExpression="Client_Type" UniqueName="Client_Type">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="Allocated_to" 
                                                                                        FilterControlAltText="Filter Allocated_to column" HeaderText="Allocated_to" 
                                                                                        SortExpression="Allocated_to" UniqueName="Allocated_to">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="Allocate_Dt" 
                                                                                        FilterControlAltText="Filter Allocate_Dt column" 
                                                                                        HeaderText="Allocate_Dt" SortExpression="Allocate_Dt" 
                                                                                        UniqueName="Allocate_Dt">
                                                                                    </telerik:GridBoundColumn>
                                                                                    <telerik:GridBoundColumn DataField="File_Status" 
                                                                                        FilterControlAltText="Filter File_Status column" HeaderText="File_Status" 
                                                                                        SortExpression="File_Status" UniqueName="File_Status">
                                                                                    </telerik:GridBoundColumn>
                                                                                     
                                                                                </Columns>
                                                                                <EditFormSettings>
                                                                                    <EditColumn FilterControlAltText="Filter EditCommandColumn column">
                                                                                    </EditColumn>
                                                                                </EditFormSettings>
                                                                            </MasterTableView>
                                                                            <FilterMenu EnableImageSprites="False">
                                                                            </FilterMenu>
                                                                            <HeaderContextMenu CssClass="GridContextMenu GridContextMenu_Default">
                                                                            </HeaderContextMenu>
                                                                        </telerik:RadGrid>
                                                                    </asp:Panel>
                                                                </td>
                                                            </tr>
                                                        </table>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 114px">
                                                        <asp:Label ID="Label134" runat="server" 
                                                            style="font-weight: 700; color: #CC0000; background-color: #FFFFFF" 
                                                            Text="File No"></asp:Label>
                                                    </td>
                                                    <td align="left" style="width: 43px">
                                                        <asp:Label ID="lblFileno" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                                    </td>
                                                    <td class="style9" style="width: 109px">
                                                        &nbsp;</td>
                                                    <td style="width: 287px" align="left">
                                                        <asp:Label ID="lblenteredby" runat="server"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" style="width: 114px">
                                                        <asp:Label ID="Label142" runat="server" 
                                                            style="font-weight: 700; color: #CC0000; background-color: #FFFFFF" 
                                                            Text="Name"></asp:Label>
                                                    </td>
                                                    <td align="left" style="width: 43px">
                                                        <asp:Label ID="lblname" runat="server" Font-Size="Medium" ForeColor="Red"></asp:Label>
                                                    </td>
                                                    <td class="style9" style="width: 109px">
                                                        Allocated to</td>
                                                    <td align="left" style="width: 287px">
                                                        <asp:Label ID="lblallocated" runat="server"></asp:Label>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="left" class="style8">
                                                        <asp:Label ID="Label126" runat="server" Text="Handover To"></asp:Label>
                                                    </td>
                                                    <td align="left" style="width: 43px">
                                                        <telerik:RadComboBox ID="cboallocateto" Runat="server" AccessibilityMode="True" 
                                                            AllowCustomText="True" AutoPostBack="True" MarkFirstMatch="True" Skin="Web20" 
                                                            Width="250px">
                                                        </telerik:RadComboBox>
                                                    </td>
                                                    <td class="style9">
                                                        <asp:Label ID="Label138" runat="server" Text="Handover Date"></asp:Label>
                                                    </td>
                                                    <td align="left" style="width: 287px">
                                                        <telerik:RadDatePicker ID="dtallocdate" Runat="server" MinDate="" Skin="Web20">
                                                            <Calendar Skin="Web20" UseColumnHeadersAsSelectors="False" 
                                                                UseRowHeadersAsSelectors="False" ViewSelectorText="x">
                                                            </Calendar>
                                                            <DateInput DateFormat="dd/MM/yyyy" DisplayDateFormat="dd/MM/yyyy">
                                                            </DateInput>
                                                            <DatePopupButton HoverImageUrl="" ImageUrl="" />
                                                        </telerik:RadDatePicker>
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td align="left" class="style8">
                                                        <asp:Label ID="Label143" runat="server" Text="Handover To"></asp:Label>
                                                    </td>
                                                    <td align="left" rowspan="2" style="width: 43px">
                                                        <telerik:RadTextBox ID="txtcomment" Runat="server" Height="50px" Skin="Sunset" TextMode="MultiLine" Width="450px">
                                                        </telerik:RadTextBox>
                                                    </td>
                                                    <td class="style9">&nbsp;</td>
                                                    <td align="left" style="width: 287px">&nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td align="left" class="style8">&nbsp;</td>
                                                    <td class="style9">&nbsp;</td>
                                                    <td align="left" style="width: 287px">&nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td bgcolor="#666666" class="style8" colspan="4">
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" colspan="2" style="height: 38px">
                                                        <asp:Label ID="lblerr" runat="server" ForeColor="Red"></asp:Label>
                                                    </td>
                                                    <td class="style9" style="width: 109px; height: 38px;">
                                                        </td>
                                                    <td style="width: 287px; height: 38px;">
                                                        <telerik:RadButton ID="cmdsave" runat="server" Height="38px" Skin="Web20" 
                                                            Text="Save" Width="80px">
                                                        </telerik:RadButton>
                                                        &nbsp;<telerik:RadButton ID="cmdedit" runat="server" Height="38px" Skin="Web20" 
                                                            Text="Edit" Width="80px">
                                                        </telerik:RadButton>
                                                        &nbsp;</td>
                                                </tr>
                                                <tr>
                                                    <td class="style8" colspan="4">
                                                        <asp:HiddenField ID="HiddenField1" runat="server" />
                                                    </td>
                                                </tr>
                                            </table>
                                        </asp:Panel>
                        
                                        </td>
                                </tr>
                            </table>
            </ContentTemplate>
            </asp:UpdatePanel>
</asp:Content>

